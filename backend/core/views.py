from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import ContactRequest, EmergencyAlert, Incident, IncidentUpdate, User
from .serializers import ContactRequestSerializer, EmergencyAlertSerializer, IncidentSerializer, IncidentUpdateSerializer, UserSerializer, UserCreateSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from .permissions import IsAdmin, IsStaff
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta, datetime


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class AdminCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        has_admin = User.objects.filter(role='admin').exists()
        return Response({'has_admin': has_admin})

class AdminBootstrapView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if User.objects.filter(role='admin').exists():
            return Response({'detail': 'Admin already exists.'}, status=400)
        
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.role = 'admin'
            user.save()
            return Response({'message': 'Bootstrap admin created.', 'user': UserSerializer(user).data}, status=201)
        return Response(serializer.errors, status=400)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(role__in=['admin', 'staff'])
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]  # Public registration allowed
        elif self.action in ['update', 'partial_update', 'destroy', 'promote_to_staff', 'promote_to_admin']:
            return [permissions.IsAuthenticated, IsAdmin]  # Only admin can modify roles
        return [permission() for permission in self.permission_classes]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        # Admin bootstrapping is handled in serializer
        serializer.save()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def create_staff(self, request):
        """Only ADMIN can create STAFF users"""
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.role = 'staff'
            user.save()
            return Response({'message': 'Staff user created', 'user': UserSerializer(user).data}, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def create_admin(self, request):
        """Only ADMIN can create other ADMIN users"""
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.role = 'admin'
            user.save()
            return Response({'message': 'Admin user created', 'user': UserSerializer(user).data}, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get'])
    def staff_list(self, request):
        staff = User.objects.filter(role='staff')
        serializer = self.get_serializer(staff, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsStaff])
    def guest_list(self, request):
        guests = User.objects.filter(role='guest')
        serializer = self.get_serializer(guests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)


class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by('-created_at')
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'assign_staff':
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        elif self.action in ['mark_resolved', 'available_staff', 'contact_authority', 'partial_update', 'update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsStaff]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsStaff])
    def stats(self, request):
        active_count = Incident.objects.filter(status='active').count()
        resolved_count = Incident.objects.filter(status='resolved').count()
        return Response({
            'active_tasks': active_count,
            'resolved_tasks': resolved_count,
        })

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get incidents created in the last N minutes (default 5 minutes)"""
        minutes = int(request.query_params.get('minutes', 5))
        since = timezone.now() - timedelta(minutes=minutes)
        recent_incidents = Incident.objects.filter(created_at__gte=since).order_by('-created_at')
        serializer = self.get_serializer(recent_incidents, many=True)
        return Response({
            'count': len(recent_incidents),
            'incidents': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def contact_authority(self, request, pk=None):
        incident = self.get_object()
        staff_id = request.data.get('staff_id')
        message_text = request.data.get('message', f'Emergency contact needed for incident: {incident.title}')

        if incident.authority_contacted:
            return Response({'message': 'Already contacted'}, status=400)

        try:
            staff = User.objects.get(id=staff_id, role='staff')
        except User.DoesNotExist:
            return Response({'message': 'Invalid staff member'}, status=400)

        # Mark as contacted
        incident.authority_contacted = True
        incident.save()

        # Create a contact request notification for the selected staff member
        ContactRequest.objects.create(
            incident=incident,
            sender=request.user,
            recipient=staff,
            message=message_text,
        )

        # Return staff details for frontend
        return Response({
            'message': f'Authority ({staff.username}) contacted successfully',
            'staff_phone': getattr(staff, 'phone', '+1-555-0000'),
            'staff_department': getattr(staff, 'department', 'General'),
            'staff_username': staff.username
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_staff(self, request, pk=None):
        incident = self.get_object()
        user_id = request.data.get('assigned_to')

        incident.assigned_to_id = user_id
        incident.save()

        return Response({'message': 'Staff assigned'})

    @action(detail=True, methods=['post'])
    def mark_resolved(self, request, pk=None):
        incident = self.get_object()
        if request.user.role not in ['admin', 'staff']:
            return Response({'detail': 'Not authorized'}, status=403)
        if incident.status == 'resolved':
            return Response({'message': 'Incident already resolved'}, status=400)

        incident.status = 'resolved'
        incident.save()
        return Response({'message': 'Incident marked as resolved', 'status': incident.status})

    @action(detail=True, methods=['get'])
    def available_staff(self, request, pk=None):
        staff = User.objects.filter(role='staff')
        serializer = UserSerializer(staff, many=True)
        return Response(serializer.data)

class IncidentUpdateViewSet(viewsets.ModelViewSet):
    queryset = IncidentUpdate.objects.all()
    serializer_class = IncidentUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)


class EmergencyAlertViewSet(viewsets.ModelViewSet):
    queryset = EmergencyAlert.objects.all()
    serializer_class = EmergencyAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return EmergencyAlert.objects.filter(recipient=user, is_read=False).order_by('-created_at')
        return EmergencyAlert.objects.none()

    def create(self, request, *args, **kwargs):
        sender = request.user
        message = request.data.get('message', '')
        guest_details = request.data.get('guest_details', '')
        
        # Extract location data from request
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        location_accuracy = request.data.get('location_accuracy')
        location_timestamp = request.data.get('location_timestamp')
        
        # Extract peer_id for camera streaming
        peer_id = request.data.get('peer_id')
        
        # Validate location coordinates if provided
        if latitude is not None and longitude is not None:
            try:
                latitude = float(latitude)
                longitude = float(longitude)
                if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                    return Response({'detail': 'Invalid location coordinates'}, status=400)
            except (ValueError, TypeError):
                return Response({'detail': 'Location coordinates must be valid numbers'}, status=400)
        
        # Validate accuracy if provided
        if location_accuracy is not None:
            try:
                location_accuracy = float(location_accuracy)
                if location_accuracy < 0:
                    return Response({'detail': 'Location accuracy cannot be negative'}, status=400)
            except (ValueError, TypeError):
                return Response({'detail': 'Location accuracy must be a valid number'}, status=400)
        
        # Parse location_timestamp if provided (convert ISO string to datetime)
        if location_timestamp is not None and isinstance(location_timestamp, str):
            try:
                location_timestamp = datetime.fromisoformat(location_timestamp.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                return Response({'detail': 'Invalid location timestamp format'}, status=400)

        recipients = User.objects.filter(role__in=['admin', 'staff'])
        alerts = []
        for recipient in recipients:
            alerts.append(EmergencyAlert(
                sender=sender,
                recipient=recipient,
                message=message,
                guest_details=guest_details,
                latitude=latitude,
                longitude=longitude,
                location_accuracy=location_accuracy,
                location_timestamp=location_timestamp,
                peer_id=peer_id,
            ))
        EmergencyAlert.objects.bulk_create(alerts)

        return Response({
            'status': 'alert sent',
            'recipients': recipients.count(),
            'location_included': latitude is not None and longitude is not None,
            'camera_enabled': peer_id is not None
        })

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        alert = self.get_object()
        if alert.recipient != request.user:
            return Response({'detail': 'Not authorized'}, status=403)
        alert.is_read = True
        alert.save()
        return Response({'status': 'read'})


class ContactRequestViewSet(viewsets.ModelViewSet):
    queryset = ContactRequest.objects.all()
    serializer_class = ContactRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ContactRequest.objects.filter(recipient=user, is_read=False).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        contact_request = self.get_object()
        if contact_request.recipient != request.user:
            return Response({'detail': 'Not authorized'}, status=403)
        contact_request.is_read = True
        contact_request.save()
        return Response({'status': 'read'})