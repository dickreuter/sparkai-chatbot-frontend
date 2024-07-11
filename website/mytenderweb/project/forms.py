from django import forms

class ContactForm(forms.Form):
    email = forms.EmailField(label='Your email')
    referral = forms.ChoiceField(
        choices=[
            ('', 'How did you hear about us?'),
            ('social_media_facebook', 'Facebook'),
            ('social_media_linkedin', 'LinkedIn'),
            ('search_engine', 'Search Engine'),
            ('friend', 'Friend/Family'),
            ('advertisement', 'Advertisement'),
            ('other', 'Other'),
        ],
        required=True,
    )
    message = forms.CharField(widget=forms.Textarea, required=True)

class CalculatorForm(forms.Form):
    hours_saved_per_bid = forms.FloatField(label='Hours Saved per Bid', min_value=0)
    hourly_rate = forms.FloatField(label='Hourly Rate', min_value=0)
    software_cost = forms.FloatField(label='Software Cost', min_value=0)
    number_of_bids = forms.IntegerField(label='Number of Bids', min_value=0)
    current_time_per_tender = forms.FloatField(label='Current Time per Tender', min_value=0)
    email = forms.EmailField(label='Your email')
    
    def clean_hours_saved_per_bid(self):
        data = self.cleaned_data['hours_saved_per_bid']
        if data < 0:
            raise forms.ValidationError("This value cannot be negative.")
        return data

    def clean_hourly_rate(self):
        data = self.cleaned_data['hourly_rate']
        if data < 0:
            raise forms.ValidationError("This value cannot be negative.")
        return data

    def clean_software_cost(self):
        data = self.cleaned_data['software_cost']
        if data < 0:
            raise forms.ValidationError("This value cannot be negative.")
        return data

    def clean_number_of_bids(self):
        data = self.cleaned_data['number_of_bids']
        if data < 0:
            raise forms.ValidationError("This value cannot be negative.")
        return data

    def clean_current_time_per_tender(self):
        data = self.cleaned_data['current_time_per_tender']
        if data < 0:
            raise forms.ValidationError("This value cannot be negative.")
        return data