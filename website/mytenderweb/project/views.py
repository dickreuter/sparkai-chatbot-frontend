import logging
import os
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from .forms import CalculatorForm, ContactForm
import io
from io import BytesIO
from xhtml2pdf import pisa
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
                    to=['alexanderhoyle123@gmail.com', 'sam@mytender.io' ]
                )
                notification_email.send()
                print("Email sent successfully.")
            except Exception as e:
                print(f"Error sending email: {e}")

            return render(request, 'roi_results.html', {'metrics': metrics})
        else:
            print("Form is not valid.")
            return render(request, 'index.html', {'form': form})
    else:
        form = CalculatorForm()
        return render(request, 'calculator.html', {'form': form})
