from rembg import remove
from PIL import Image

input_path = '/Users/anshikaseth/Downloads/people-creating-social-media-landing-page/3847762.jpg'
output_path = '/Users/anshikaseth/prepzy/public/mascot.png'

input = Image.open(input_path)
output = remove(input)
output.save(output_path)
print("SUCCESS")
