import re
import os


def load_template_content(template_path):
    with open(template_path, 'r', encoding='utf-8') as file:
        return file.read()


def find_extends(template_content):
    match = re.search(r"{% extends '(.*?)' %}", template_content)
    return match.group(1) if match else None


def replace_static_and_url_tags(content):
    content = re.sub(r"{% static '(.*?)' %}", r"static/\1", content)
    content = re.sub(r"{% url '([^']+)' %}", r"/\1/", content)
    return content


def merge_templates(child_content, base_dir):
    extends_filename = find_extends(child_content)
    if not extends_filename:
        return replace_static_and_url_tags(child_content)

    base_content = load_template_content(os.path.join(base_dir, extends_filename))

    # Remove extends line
    child_content = re.sub(r"{% extends '.*?' %}", '', child_content, count=1)

    # Replace blocks
    blocks = re.findall(r"{% block (.*?) %}(.*?){% endblock.*? %}", child_content, re.DOTALL)
    for block_name, block_content in blocks:
        regex = r"{% block " + block_name + r" %}(.*?){% endblock.*? %}"
        if re.search(regex, base_content, re.DOTALL):
            base_content = re.sub(regex, block_content, base_content, flags=re.DOTALL)
        else:
            base_content += block_content

    return replace_static_and_url_tags(base_content)


def convert_django_template_to_html(input_file_path, output_file_path, base_dir):
    # Read the initial child template
    child_content = load_template_content(input_file_path)

    # Merge templates recursively
    final_content = merge_templates(child_content, base_dir)

    # Write the final content to an output file
    with open(output_file_path, 'w', encoding='utf-8') as file:
        file.write(final_content)


# Usage example
base_dir = '.'
input_file_path = os.path.join(base_dir, 'index.html')
output_file_path = 'index_new.html'
convert_django_template_to_html(input_file_path, output_file_path, base_dir)
