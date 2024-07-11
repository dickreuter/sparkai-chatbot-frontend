import logging
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from .forms import CalculatorForm, ContactForm

logger = logging.getLogger(__name__)

def home(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            referral = form.cleaned_data['referral']
            message = form.cleaned_data['message']
            
            # Combine referral source with message
            full_message = f"Referral Source: {referral}\n\nMessage:\n{message}\n\nFrom: \n{email}\n"

            try:
                # Send the email
                send_mail(
                    subject="New Contact Form Submission",
                    message=full_message,
                    from_email='alexanderhoyle123@gmail.com',  # Sender's email address
                    recipient_list=['sam@mytender.io', 'alexanderhoyle123@gmail.com'],  # Send to this email address
                    fail_silently=False,
                )
                logger.debug("Email sent successfully.")
                print("Email sent successfully.")
                return redirect('thankyou')  # Redirect to thank you page
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

def calculate_metrics(hours_saved_per_bid, hourly_rate, software_cost, number_of_bids, current_time_per_tender):
    # Calculate Bid Writer Time Saved
    bid_writer_time_saved = hours_saved_per_bid * number_of_bids

    # Calculate Bid Writer Cost Saved
    bid_writer_cost_saved = bid_writer_time_saved * hourly_rate

    # Calculate Number of Additional Tenders You Can Apply For
    additional_tenders = bid_writer_time_saved / current_time_per_tender

    # Calculate Number of Times You Could Spend More per Tender
    times_more_per_tender = bid_writer_time_saved / current_time_per_tender

    # Calculate ROI
    net_gain = bid_writer_cost_saved - software_cost
    roi = (net_gain / software_cost) * 100

    return {
        "Bid Writer Time Saved (hours)": bid_writer_time_saved,
        "Bid Writer Cost Saved": bid_writer_cost_saved,
        "Number of Additional Tenders": additional_tenders,
        "Number of Times More per Tender": times_more_per_tender,
        "ROI (%)": roi
    }

def calculator(request):
    if request.method == 'POST':
        form = CalculatorForm(request.POST)
        if form.is_valid():
            # Extract data from form
            hours_saved_per_bid = form.cleaned_data['hours_saved_per_bid']
            hourly_rate = form.cleaned_data['hourly_rate']
            software_cost = form.cleaned_data['software_cost']
            number_of_bids = form.cleaned_data['number_of_bids']
            current_time_per_tender = form.cleaned_data['current_time_per_tender']
            email = form.cleaned_data['email']
            
            # Calculate metrics
            metrics = calculate_metrics(hours_saved_per_bid, hourly_rate, software_cost, number_of_bids, current_time_per_tender)
            
            # Convert metrics to a string
            metrics_str = "\n".join([f"{key}: {value}" for key, value in metrics.items()])
            
            try:
                # Send email to the user
                send_mail(
                    'Your ROI Calculation Results',
                    f'Thank you for using our calculator. Here are your results:\n\n{metrics_str}',
                    from_email='sam@mytender.io',  # use the configured default email
                    recipient_list=[email],
                    fail_silently=False,
                )
                print("ROI email sent successfully.")
                # Send notification email
                send_mail(
                    subject="New ROI Form Submission",
                    message=f"Here are the results:\n\n{metrics_str}\n\nfor: {email}",
                    from_email='alexanderhoyle123@gmail.com',  # Sender's email address
                    recipient_list=['sam@mytender.io', 'alexanderhoyle123@gmail.com'],  # Send to this email address
                    fail_silently=False,
                )
                logger.debug("Emails sent successfully.")
                print("Emails sent successfully.")
            except Exception as e:
                logger.error(f"Error sending email: {e}")
                print(f"Error sending email: {e}")
            
            # Pass metrics to the thank you template
            return render(request, 'calculatorThankYou.html', {'metrics': metrics})
        else:
            logger.debug("Form is not valid.")
            print("Form is not valid.")
            return render(request, 'index.html', {'form': form})
    else:
        form = CalculatorForm()
        logger.debug("Rendering form.")
        return render(request, 'calculator.html', {'form': form})