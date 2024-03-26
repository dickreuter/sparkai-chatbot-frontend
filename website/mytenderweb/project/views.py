from django.core.mail import send_mail
from django.shortcuts import render, redirect
from .forms import ContactForm

def home(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            from_email = form.cleaned_data['email']
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']
            
            # Combine first name and last name with message
            full_message = f"From: {first_name} {last_name}\n\n{message}"

            send_mail(
                subject,
                full_message,
                from_email,
                ['info@mytender.io'],
                fail_silently=True,
            )
            return redirect('/')  # Redirect to a new URL for successful submission
    else:
        form = ContactForm()

    return render(request, 'index.html', {'form': form})
