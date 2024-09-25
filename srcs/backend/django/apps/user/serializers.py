from django.core import serializers
from rest_framework import serializers
from .models import AppUser
from rest_framework.serializers import ModelSerializer

# from django.core.files.images import get_image_dimensions
# to send data from database to user


class UserSerializerClass(ModelSerializer):
    confirm_password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )
    avatar = serializers.FileField(allow_null=True, required=False, use_url=True)

    class Meta:
        model = AppUser
        fields = ["id", "username", "email", "password", "confirm_password", "avatar"]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
        }

    def validate_email(self, value):
        if AppUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    # nickname will be set before tournament
    # def validate_nickname(self, value):
    # 	if AppUser.objects.filter(nickname__iexact=value).exists():
    # 		raise serializers.ValidationError({"error": "This nickname is already in use."})
    # 	return value

    def validate_avatar(self, value):
        if value:
            if not value.content_type.startswith("image"):
                raise serializers.ValidationError("Only image files are allowed.")
            if value.size > 5 * 1024 * 1024:  # limit file size to 5 MB
                raise serializers.ValidationError("Avatar size must not exceed 5 MB.")
        return value

    def validate(self, data) -> None:
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords don't match.")
        return data

    def save(self, **kwargs):
        validated_data = {
            key: value
            for key, value in self.validated_data.items()
            if key != "confirm_password"
        }

        user_data = {
            "username": validated_data["username"],
            "email": validated_data["email"],
            "password": validated_data["password"],
        }
        if "avatar" in validated_data:
            user_data["avatar"] = validated_data["avatar"]

        new_user = AppUser.objects.create_user(**user_data)

        return new_user
