import logging
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from .forms import ContactForm

logger = logging.getLogger(__name__)

def home(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            referral = form.cleaned_data['referral']
            message = form.cleaned_data['message']
            
            # Combine referral source with message
            full_message = f"Referral Source: {referral}\n\nMessage:\n{message}"

            try:
                # Send the email
                send_mail(
                    subject="New Contact Form Submission",
                    message=full_message,
                    from_email=email,  # Sender's email address
                    recipient_list=['sam@mytender.io'],  # Send to this email address
                    fail_silently=False,
                )
                logger.debug("Email sent successfully.")
                print("Email sent successfully.")
            except Exception as e:
                logger.error(f"Error sending email: {e}")
                print(f"Error sending email: {e}")

            return redirect('/')  # Redirect to a new URL for successful submission
        else:
            logger.debug("Form is not valid.")
            print("Form is not valid.")
    else:
        form = ContactForm()
        logger.debug("Rendering form.")

    return render(request, 'index.html', {'form': form})
