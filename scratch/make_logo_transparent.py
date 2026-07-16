import os
from PIL import Image

# Path to the logo image
input_path = "E:/Mara Photo/Mara Photo/frontend/public/logo.jpg"
output_path = "E:/Mara Photo/Mara Photo/frontend/public/logo.png"

try:
    if os.path.exists(input_path):
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        datas = img.getdata()
        newData = []
        
        for item in datas:
            # If the pixel is close to white, make it transparent
            # Threshold: 230
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                newData.append((255, 255, 255, 0)) # fully transparent
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print("Successfully created transparent logo.png!")
    else:
        print(f"Error: Input logo not found at {input_path}")
except Exception as e:
    print(f"Error processing logo: {e}")
