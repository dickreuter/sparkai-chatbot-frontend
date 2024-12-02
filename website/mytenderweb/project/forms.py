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
    
class GuideForm(forms.Form):
    email = forms.EmailField(label='Email', max_length=100)



class TrialSignupForm(forms.Form):
    first_name = forms.CharField(
        max_length=256,
        widget=forms.TextInput(attrs={
            'class': 'form-input w-input',
            'placeholder': 'John',
        })
    )
    
    last_name = forms.CharField(
        max_length=256,
        widget=forms.TextInput(attrs={
            'class': 'form-input w-input',
            'placeholder': 'Doe',
        })
    )
    
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-input w-input',
            'placeholder': 'johndoe@email.com',
        })
    )
    
    COMPANY_SIZE_CHOICES = [
        ('', 'Select company size'),  # Add empty default choice
        ('25-50', '25-50'),
        ('50-100', '50-100'),
        ('100-1000', '100-1000'),
        ('1000+', '1000+'),
    ]
    
    company_size = forms.ChoiceField(
        choices=COMPANY_SIZE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-input is-select w-select',
        })
    )
    
    MAIN_USE_CHOICES = [
    ('', 'Select main use'),
    ('Time_Reduction', 'Reduce Bid Writing Time by 40%'),
    ('Process_Automation', 'Automate Repetitive Bid Tasks'),
    ('Quality_Improvement', 'Improve Bid Quality & Consistency'),
    ('Resource_Optimization', 'Optimize Team Resources & Workload'),
    ('Success_Rate', 'Increase Bid Win Rate'),
    ('Cost_Reduction', 'Reduce Bid Production Costs')
]
    
    main_use = forms.ChoiceField(
        choices=MAIN_USE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-input is-select w-select',
        })
    )
    
    privacy_policy = forms.BooleanField(
        required=True,
        widget=forms.CheckboxInput(attrs={
            'class': 'w-checkbox-input checkbox',
        })
    )