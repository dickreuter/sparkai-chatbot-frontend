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
