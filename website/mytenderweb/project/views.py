import logging
import os
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from .forms import CalculatorForm, ContactForm, GuideForm
import io
from io import BytesIO
from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.core.mail import EmailMessage
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics import renderPDF
from reportlab.lib import colors
from django.template.loader import render_to_string

from .brevo import add_email_to_brevo_list
import stripe
from django.views.generic import TemplateView
from django.views import View
from django.http import JsonResponse, HttpResponse
from django.views import generic
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect, reverse

logger = logging.getLogger(__name__)

def home(request):

    stripe_publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY_TEST')

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

                 # Add email to Brevo list contact-us, 5
                add_email_to_brevo_list(email, 5)

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

    return render(request, 'index.html', {'form': form, 'stripe_publishable_key': stripe_publishable_key})



def calculate_metrics(industry, number_of_bid_writers, average_bids_per_month, average_time_per_bid, average_bid_value):
    time_saved_percentage = 0.70  # 70% time saved
    hourly_rate = 50  # Fixed hourly rate for bid writers
    software_cost_per_writer = 6000  # Fixed software cost per bid writer

    number_of_bids_per_year = average_bids_per_month * 12
    hours_saved_per_bid = average_time_per_bid * time_saved_percentage
    bid_writer_time_saved = hours_saved_per_bid * number_of_bids_per_year
    bid_writer_cost_saved = bid_writer_time_saved * hourly_rate
    additional_revenue_per_year = (bid_writer_time_saved / average_time_per_bid) * average_bid_value
    total_software_cost = software_cost_per_writer * number_of_bid_writers
    roi = ((bid_writer_cost_saved + additional_revenue_per_year - total_software_cost) / total_software_cost) * 100
    number_of_times_more_per_tender = bid_writer_time_saved / number_of_bids_per_year

    return {
        "industry": industry,
        "bid_writer_time_saved": round(bid_writer_time_saved),
        "bid_writer_cost_saved": round(bid_writer_cost_saved),
        "additional_revenue_per_year": round(additional_revenue_per_year),
        "roi": round(roi),
        "number_of_times_more_per_tender": round(number_of_times_more_per_tender)
    }





def calculator(request):
    if request.method == 'POST':
        form = CalculatorForm(request.POST)
        if form.is_valid():
            industry = form.cleaned_data['industry']
            number_of_bid_writers = form.cleaned_data['number_of_bid_writers']
            average_bids_per_month = form.cleaned_data['average_bids_per_month']
            average_time_per_bid = form.cleaned_data['average_time_per_bid']
            average_bid_value = form.cleaned_data['average_bid_value']
            email = form.cleaned_data['email']

            metrics = calculate_metrics(industry, number_of_bid_writers, average_bids_per_month, average_time_per_bid, average_bid_value)
            try:
                notification_email = EmailMessage(
                    subject="New ROI Form Submission",
                    body=f"Here are the results for: {email}\n\n"
                         f'Industry: {metrics["industry"]}\n'
                         f'Bid Writer Time Saved (hours): {metrics["bid_writer_time_saved"]}\n'
                         f'Bid Writer Cost Saved: {metrics["bid_writer_cost_saved"]}\n'
                         f'Additional Revenue per Year: {metrics["additional_revenue_per_year"]}\n'
                         f'ROI (%): {metrics["roi"]}\n'
                         f'Number of Times More per Tender: {metrics["number_of_times_more_per_tender"]}',
                    from_email='alexanderhoyle123@gmail.com',
                    to=['alexanderhoyle123@gmail.com', 'sam@mytender.io']
                )
                notification_email.send()
                print("Email sent successfully.")

                # Add email to Brevo list roi-calculator, 4
                add_email_to_brevo_list(email, 4)

            except Exception as e:
                print(f"Error sending email: {e}")

            return render(request, 'roi_results.html', {'metrics': metrics})
        else:
            print("Form is not valid.")
            print(form.errors)  # Print form errors to the console for debugging
            return render(request, 'calculator.html', {'form': form})
    else:
        form = CalculatorForm()
        return render(request, 'calculator.html', {'form': form})



def guide(request):
    if request.method == 'POST':
        form = GuideForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']

            # Send the guide email
            try:
                send_mail(
                    subject="Your Free Guide",
                    message="Thank you for requesting our free guide on prompt engineering. Please find the guide attached.",
                    from_email='sam@mytender.io',
                    recipient_list=[email],
                    fail_silently=False,
                )
                print("Guide email sent successfully.")

                # Add email to Brevo list meta-guide-download, 3
                add_email_to_brevo_list(email, 3)

                return render(request, 'guideThankYouForm.html')
            except Exception as e:
                print(f"Error sending guide email: {e}")
                return redirect('guide')

        else:
            logger.debug("Form is not valid.")
            print("Form is not valid.")
    else:
        form = GuideForm()
        logger.debug("Rendering form.")

    return render(request, 'guide.html', {'form': form})



########################### PAYMENT ################################################################################




stripe.api_key = os.getenv('STRIPE_SECRET_KEY_TEST')


def cancel(request) -> HttpResponse:
    return render(request, 'index.html')


def success(request) -> HttpResponse:

    print(f'{request.session = }')

    stripe_checkout_session_id = request.GET['session_id']

    return render(request, 'success.html')

def testingEnrollment(request):

    stripe_publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY_TEST')
    
    return render(request, 'enrollmentTesting.html', {'stripe_publishable_key': stripe_publishable_key})



DOMAIN = os.getenv('DOMAIN')

def create_checkout_session(request) -> HttpResponse:
    price_lookup_key = request.POST['price_lookup_key']
    try:
        prices = stripe.Price.list(lookup_keys=[price_lookup_key], expand=['data.product'])
        price_item = prices.data[0]

        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {'price': price_item.id, 'quantity': 1},
                # You could add differently priced services here, e.g., standard, business, first-class.
            ],
            mode='subscription',
            success_url=DOMAIN + reverse('success') + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=DOMAIN + reverse('cancel')
        )

        print("create checkout session")

        return redirect(
            checkout_session.url,  # Either the success or cancel url.
            code=303
        )
    except Exception as e:
        print(e)
        return HttpResponse("Server error", status=500)



@csrf_exempt
def collect_stripe_webhook(request) -> JsonResponse:
    """
    Stripe sends webhook events to this endpoint.
    We verify the webhook signature and updates the database record.
    """
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    signature = request.META["HTTP_STRIPE_SIGNATURE"]
    payload = request.body

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=signature, secret=webhook_secret
        )
    except ValueError as e:  # Invalid payload.
        raise ValueError(e)
    except stripe.error.SignatureVerificationError as e:  # Invalid signature
        raise stripe.error.SignatureVerificationError(e)

    print("update record")

    return JsonResponse({'status': 'success'})


