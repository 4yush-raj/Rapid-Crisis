"""
ImageKit utility functions for image upload and management
"""
import os
from django.conf import settings
from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions


def get_imagekit_instance():
    """Initialize and return ImageKit instance"""
    imagekit = ImageKit(
        private_key=settings.IMAGEKIT_PRIVATE_KEY,
        public_key=settings.IMAGEKIT_PUBLIC_KEY,
        url_endpoint=settings.IMAGEKIT_URL_ENDPOINT
    )
    return imagekit


def upload_incident_image(file, filename=None):
    """
    Upload incident image to ImageKit
    
    Args:
        file: File object from request.FILES
        filename: Optional custom filename
        
    Returns:
        dict: Contains 'url' (image URL) and 'file_id' (ImageKit file ID)
        or None if upload fails
    """
    try:
        imagekit = get_imagekit_instance()
        
        if not filename:
            filename = file.name
        
        # Read file content
        file_content = file.read()
        
        # Upload to ImageKit in rapid-crisis folder
        options = UploadFileRequestOptions(
            folder=settings.IMAGEKIT_FOLDER,
            is_private_file=False
        )
        
        response = imagekit.upload_file(
            file=file_content,
            file_name=filename,
            options=options
        )
        
        if response and response.get('file_id'):
            return {
                'url': response.get('url'),
                'file_id': response.get('file_id'),
                'path': response.get('file_path')
            }
        
        return None
        
    except Exception as e:
        print(f"ImageKit upload error: {str(e)}")
        return None


def delete_incident_image(file_id):
    """
    Delete image from ImageKit by file ID
    
    Args:
        file_id: ImageKit file ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        imagekit = get_imagekit_instance()
        imagekit.delete_file(file_id)
        return True
    except Exception as e:
        print(f"ImageKit delete error: {str(e)}")
        return False


def get_image_url(file_id, transformations=None):
    """
    Generate ImageKit URL with optional transformations
    
    Args:
        file_id: ImageKit file ID
        transformations: dict of transformation parameters
        
    Returns:
        str: ImageKit URL
    """
    imagekit = get_imagekit_instance()
    url = f"{settings.IMAGEKIT_URL_ENDPOINT}{settings.IMAGEKIT_FOLDER}/{file_id}"
    
    if transformations:
        # Build transformation query string
        transform_str = ",".join([f"{k}-{v}" for k, v in transformations.items()])
        url = f"{settings.IMAGEKIT_URL_ENDPOINT}/{transform_str}/{settings.IMAGEKIT_FOLDER}/{file_id}"
    
    return url
