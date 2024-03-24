from django.contrib import admin
from django.urls import path

from django.views.generic import TemplateView

urlpatterns = [
    path("ITservices", TemplateView.as_view(template_name="ITServices.html"), name='ITservices'),
    path("financialservices", TemplateView.as_view(template_name="financialservices.html"), name='financialservices'),
    path("facilitymanagement", TemplateView.as_view(template_name="facilitymanagement.html"), name='facilitymanagement'),
    path("languageengines", TemplateView.as_view(template_name="languageengines.html"), name='languageengines'),
    path("recruitmentagency", TemplateView.as_view(template_name="recruitmentagency.html"), name='recruitmentagency'),
    path("aiconsulting", TemplateView.as_view(template_name="aiconsulting.html"), name='aiconsulting'),
    path("languageengines", TemplateView.as_view(template_name="languageengines.html"), name='languageengines'),
    path("recruitmentagency", TemplateView.as_view(template_name="recruitmentagency.html"), name='recruitmentagency'),
    path("aiconsulting", TemplateView.as_view(template_name="aiconsulting.html"), name='aiconsulting'),
    path("futureai", TemplateView.as_view(template_name="aiblog.html"), name='futureai'),
    path("story", TemplateView.as_view(template_name="story.html"), name='story'),
    path("intro", TemplateView.as_view(template_name="intro.html"), name='intro'),
    path("", TemplateView.as_view(template_name="index.html"), name='home'),

]
