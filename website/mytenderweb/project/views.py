import logging
import os
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from .forms import CalculatorForm, ContactForm
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.core.mail import EmailMessage
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics import renderPDF
from reportlab.lib import colors
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




def generate_pdf(metrics):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)

    # Determine the path to the logo image relative to the current script
    current_dir = os.path.dirname(__file__)
    logo_path = os.path.join(current_dir, '../static/images/mytender.io_badge.png')
    logo_path = os.path.normpath(logo_path)

    # Draw the logo in the top right corner, smaller and further down
    logo_width = 0.75 * inch
    logo_height = 0.75 * inch
    p.drawImage(logo_path, 450, 720, width=logo_width, height=logo_height)

    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, "ROI Calculation Results")

    # Add a chart
    drawing = Drawing(400, 200)
    data = [(metrics["Bid Writer Time Saved (hours)"], metrics["Bid Writer Cost Saved"], metrics["ROI (%)"])]
    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 50
    bc.height = 125
    bc.width = 300
    bc.data = data
    bc.strokeColor = colors.black
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = max(metrics["Bid Writer Time Saved (hours)"], metrics["Bid Writer Cost Saved"], metrics["ROI (%)"]) * 1.2
    bc.valueAxis.valueStep = max(metrics["Bid Writer Time Saved (hours)"], metrics["Bid Writer Cost Saved"], metrics["ROI (%)"]) // 5
    drawing.add(bc)

    renderPDF.draw(drawing, p, 100, 500)

    # Add metrics with explanations
    p.setFont("Helvetica", 12)
    y = 450
    explanations = {
        "Bid Writer Time Saved (hours)": "This is the total time saved for bid writing based on your inputs.",
        "Bid Writer Cost Saved": "This represents the cost savings due to reduced bid writing time.",
        "Number of Additional Tenders": "This is the number of additional tenders you can apply for with the time saved.",
        "Number of Times More per Tender": "This shows how many more times you can spend on each tender.",
        "ROI (%)": "This is the return on investment based on your inputs."
    }
    for key, value in metrics.items():
        p.drawString(100, y, f"{key}: {value}")
        p.drawString(100, y - 15, explanations[key])
        y -= 40

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer

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

            # Generate PDF
            pdf_buffer = generate_pdf(metrics)

            try:
                # Create email with PDF attachment
                email_message = EmailMessage(
                    'Your ROI Calculation Results',
                    'Thank you for using our calculator. Please find your results attached. Here is a summary:\n\n'
                    f'Bid Writer Time Saved (hours): {metrics["Bid Writer Time Saved (hours)"]}\n'
                    f'Bid Writer Cost Saved: {metrics["Bid Writer Cost Saved"]}\n'
                    f'Number of Additional Tenders: {metrics["Number of Additional Tenders"]}\n'
                    f'Number of Times More per Tender: {metrics["Number of Times More per Tender"]}\n'
                    f'ROI (%): {metrics["ROI (%)"]}\n\n'
                    'We hope you find these insights useful. If you have any questions, feel free to contact us.',
                    'sam@mytender.io',  # use the configured default email
                    [email]
                )
                email_message.attach('ROI_Calculation_Results.pdf', pdf_buffer.getvalue(), 'application/pdf')
                email_message.send()
                print("ROI email with PDF sent successfully.")

                # Send notification email
                notification_email = EmailMessage(
                    subject="New ROI Form Submission",
                    body=f"Here are the results for: {email}\n\n"
                         f'Bid Writer Time Saved (hours): {metrics["Bid Writer Time Saved (hours)"]}\n'
                         f'Bid Writer Cost Saved: {metrics["Bid Writer Cost Saved"]}\n'
                         f'Number of Additional Tenders: {metrics["Number of Additional Tenders"]}\n'
                         f'Number of Times More per Tender: {metrics["Number of Times More per Tender"]}\n'
                         f'ROI (%): {metrics["ROI (%)"]}',
                    from_email='alexanderhoyle123@gmail.com',  # Sender's email address
                    to=['sam@mytender.io', 'alexanderhoyle123@gmail.com']  # Send to these email addresses
                )
                notification_email.attach('ROI_Calculation_Results.pdf', pdf_buffer.getvalue(), 'application/pdf')
                notification_email.send()
                logger.debug("Emails with PDF sent successfully.")
                print("Emails with PDF sent successfully.")
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