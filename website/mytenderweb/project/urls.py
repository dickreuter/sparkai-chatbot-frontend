from django.contrib import admin
from django.urls import path
from .views import home
from django.views.generic import TemplateView

urlpatterns = [
    path("ITservices", TemplateView.as_view(template_name="ITServices.html"), name='ITservices'),
    path("financialservices", TemplateView.as_view(template_name="financialservices.html"), name='financialservices'),
    path("facilitymanagement", TemplateView.as_view(template_name="facilitymanagement.html"), name='facilitymanagement'),
    path("healthcare", TemplateView.as_view(template_name="healthcare.html"), name='healthcare'),
    path("telecoms", TemplateView.as_view(template_name="telecoms.html"), name='telecoms'),
    path("publicsector", TemplateView.as_view(template_name="publicsector.html"), name='publicsector'),
    path("languageengine", TemplateView.as_view(template_name="languageengine.html"), name='languageengine'),
    path("security", TemplateView.as_view(template_name="security.html"), name='security'),
    path("futureai", TemplateView.as_view(template_name="aiblog.html"), name='futureai'),
    path("story", TemplateView.as_view(template_name="story.html"), name='story'),
    path("intro", TemplateView.as_view(template_name="intro.html"), name='intro'),
     path("", home, name='home'),

]
