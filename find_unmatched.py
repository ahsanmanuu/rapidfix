
import re

def find_first_unmatched_close(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = 0
    
    # We will process line by line.
    # Note: This is a simple parser. It might be fooled by multi-line comments or props.
    # But for JSX structure it usually works.
    
    for i, line in enumerate(lines):
        # Remove simple string contents to avoid confused > inside strings
        # simple quote removal
        line_clean = re.sub(r'(".*?"|\'.*?\')', '', line)
        
        # Find all divs
        # We look for <div ... > (open)
        # </div> (close)
        # <div ... /> (self-closing - neutral)
        
        # We'll use a cursor to scan the line to handle multiple tags on one line correctly
        matches = [(m.start(), 'open') for m in re.finditer(r'<div\b[^>]*[^/]>(?!.*/>)', line_clean)]
        matches += [(m.start(), 'close') for m in re.finditer(r'</div>', line_clean)]
        # self closing we can ignore for stack balance if we identify them correctly.
        # But wait, regex above for 'open' is tricky. <div /> matches <div ... > pattern if not careful.
        # Improved regex for open: <div\b[^>]*> but NOT ending in />.
        
        # Let's adjust regex strategies.
        # Find all tags starting with <div or </div
        tags = re.finditer(r'(<div\b[^>]*>|</div>)', line_clean)
        
        sorted_tags = []
        for tag in tags:
            s = tag.group(0)
            if s == '</div>':
                sorted_tags.append('close')
            else:
                if '/' in s[-2:]: # self closing <div /> or <div ... />
                    pass
                else:
                    sorted_tags.append('open')

        for tag_type in sorted_tags:
            if tag_type == 'open':
                stack += 1
            elif tag_type == 'close':
                stack -= 1
            
            if stack < 0:
                print(f"First unmatched close at Line {i+1}: {line.strip()}")
                return

    print(f"Final stack: {stack}")
    if stack > 0:
        print("Unclosed tags remaining")

find_first_unmatched_close('client/src/pages/TechnicianDashboard.jsx')
