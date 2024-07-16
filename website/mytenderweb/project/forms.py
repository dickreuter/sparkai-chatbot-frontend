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
    industry = forms.CharField(label='What Industry are you?', max_length=100)
    number_of_bid_writers = forms.IntegerField(label='How many Bid Writers do you have?', min_value=0)
    average_bids_per_month = forms.IntegerField(label='Average Number of Bids per month', min_value=0)
    average_time_per_bid = forms.FloatField(label='Average Time per Bid (hours)', min_value=0)
    average_bid_value = forms.FloatField(label='Average Bid Value', min_value=0)
    email = forms.EmailField(label='Email Address')

    def clean_number_of_bid_writers(self):
        data = self.cleaned_data['number_of_bid_writers']
        if data <= 0:
            raise forms.ValidationError("This value cannot be less than zero.")
        return data

    def clean_average_bids_per_month(self):
        data = self.cleaned_data['average_bids_per_month']
        if data <= 0:
            raise forms.ValidationError("This value cannot be less than zero.")
        return data

    def clean_average_time_per_bid(self):
        data = self.cleaned_data['average_time_per_bid']
        if data <= 0:
            raise forms.ValidationError("This value cannot be less than zero.")
        return data

    def clean_average_bid_value(self):
        data = self.cleaned_data['average_bid_value']
        if data <= 0:
            raise forms.ValidationError("This value cannot be less than zero.")
        return data