
# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('guest', 'Guest'),
    )
    DEPARTMENT_CHOICES = (
        ('fire', 'Fire Department'),
        ('medical', 'Medical Emergency'),
        ('security', 'Security'),
        ('maintenance', 'Maintenance'),
        ('general', 'General'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='guest')
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='general')
    age = models.PositiveIntegerField(blank=True, null=True)
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)

class Incident(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('resolved', 'Resolved'),
    )
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    image_url = models.URLField(max_length=500, null=True, blank=True)  # Store ImageKit URL
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    latitude = models.FloatField(null=True, blank=True)  
    longitude = models.FloatField(null=True, blank=True) 

    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')

    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_incidents')

    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    authority_contacted = models.BooleanField(default=False)
    authority_contacted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='contacted_authorities')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class IncidentUpdate(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='updates')
    message = models.TextField()
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='messages')
    sent_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    sent_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sent_by.username} to {self.sent_to.username}"


class ContactRequest(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='contact_requests')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_contact_requests')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_contact_requests')
    message = models.TextField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contact request for {self.recipient.username} on {self.incident.title}"


class EmergencyAlert(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_emergency_alerts')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_emergency_alerts')
    message = models.TextField(blank=True, null=True)
    guest_details = models.TextField(blank=True, null=True)
    
    # Location tracking fields for emergency response
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_accuracy = models.FloatField(null=True, blank=True)  # Accuracy in meters
    location_timestamp = models.DateTimeField(null=True, blank=True)  # When location was captured
    
    # Camera streaming fields
    peer_id = models.CharField(max_length=255, blank=True, null=True)  # PeerJS ID for camera stream
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Emergency alert for {self.recipient.username} from {self.sender.username}"