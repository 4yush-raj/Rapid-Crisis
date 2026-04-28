# Generated migration for adding location tracking to EmergencyAlert

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_emergencyalert'),
    ]

    operations = [
        migrations.AddField(
            model_name='emergencyalert',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='emergencyalert',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='emergencyalert',
            name='location_accuracy',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='emergencyalert',
            name='location_timestamp',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
