from django.contrib import admin
from django.urls import path

from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("marketresearch", TemplateView.as_view(template_name="marketresearch.html"), name='marketresearch'),
    path("procurement", TemplateView.as_view(template_name="procurement.html"), name='procurement'),
    path("businessintel", TemplateView.as_view(template_name="businessintel.html"), name='businessintel'),
    path("languageengines", TemplateView.as_view(template_name="languageengines.html"), name='languageengines'),
    path("recruitmentagency", TemplateView.as_view(template_name="recruitmentagency.html"), name='recruitmentagency'),
    path("aiconsulting", TemplateView.as_view(template_name="aiconsulting.html"), name='aiconsulting'),
    path("languageengines", TemplateView.as_view(template_name="languageengines.html"), name='languageengines'),
    path("recruitmentagency", TemplateView.as_view(template_name="recruitmentagency.html"), name='recruitmentagency'),
    path("aiconsulting", TemplateView.as_view(template_name="aiconsulting.html"), name='aiconsulting'),
    path("futureai", TemplateView.as_view(template_name="aiblog.html"), name='futureai'),
    path("story", TemplateView.as_view(template_name="story.html"), name='story'),
    path("intro", TemplateView.as_view(template_name="intro.html"), name='intro'),
    path("", TemplateView.as_view(template_name="intro.html"), name='intro'),

]
