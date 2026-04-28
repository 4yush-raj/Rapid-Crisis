from rest_framework import serializers
from .models import ContactRequest, EmergencyAlert, Incident, IncidentUpdate, User, Message

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'phone', 'department', 'age', 'gender']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        
        # All public registrations default to guest role
        # Admin bootstrapping is handled via separate endpoint
        role = 'guest'
        
        user = User(role=role, **validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'email', 'phone', 'department', 'age', 'gender']
        read_only_fields = ['id', 'username', 'role']


class IncidentUpdateSerializer(serializers.ModelSerializer):
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = IncidentUpdate
        fields = '__all__'


class IncidentSerializer(serializers.ModelSerializer):
    reported_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    authority_contacted_by = UserSerializer(read_only=True)
    updates = IncidentUpdateSerializer(many=True, read_only=True)
    messages = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = '__all__'
    
    def get_messages(self, obj):
        messages = obj.messages.all()
        return MessageSerializer(messages, many=True).data


class MessageSerializer(serializers.ModelSerializer):
    sent_by = UserSerializer(read_only=True)
    sent_to = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = '__all__'


class ContactRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    incident = IncidentSerializer(read_only=True)

    class Meta:
        model = ContactRequest
        fields = ['id', 'incident', 'sender', 'recipient', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'incident', 'sender', 'recipient', 'created_at']


class EmergencyAlertSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = EmergencyAlert
        fields = ['id', 'sender', 'recipient', 'message', 'guest_details', 'latitude', 'longitude', 'location_accuracy', 'location_timestamp', 'peer_id', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'recipient', 'created_at']