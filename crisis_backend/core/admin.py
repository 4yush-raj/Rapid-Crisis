from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from .models import ContactRequest, EmergencyAlert, User


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'role', 'email', 'phone', 'age', 'gender', 'department')


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ('username', 'role', 'email', 'phone', 'age', 'gender', 'department')


class CustomUserAdmin(DjangoUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    list_display = ['username', 'role', 'email', 'phone', 'age', 'gender', 'is_staff', 'is_superuser']
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Additional information', {'fields': ('role', 'phone', 'age', 'gender', 'department')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 'role', 'phone', 'age', 'gender', 'department'),
        }),
    )


class ContactRequestAdmin(admin.ModelAdmin):
    list_display = ['incident', 'sender', 'recipient', 'created_at', 'is_read']
    list_filter = ['is_read', 'created_at']
    search_fields = ['incident__title', 'sender__username', 'recipient__username', 'message']


class EmergencyAlertAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'created_at', 'is_read']
    list_filter = ['is_read', 'created_at']
    search_fields = ['sender__username', 'recipient__username', 'message', 'guest_details']


admin.site.register(User, CustomUserAdmin)
admin.site.register(ContactRequest, ContactRequestAdmin)
admin.site.register(EmergencyAlert, EmergencyAlertAdmin)