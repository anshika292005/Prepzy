from rembg import remove
from PIL import Image
import os

input_path = 'public/prepzy-full.png'
output_path = 'public/prepzy-transparent.png'

try:
    if os.path.exists(input_path):
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path)
        print("SUCCESS: Background removed and saved to " + output_path)
    else:
        print("ERROR: Input file not found")
except Exception as e:
    print("ERROR: " + str(e))
