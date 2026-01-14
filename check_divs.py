
import re

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Naive regex for standard JSX divs. 
    # Ignores comments roughly, but not perfect. 
    # Sufficient for finding major mismatches.
    
    # Remove simple comments
    content = re.sub(r'{/\*.*?\*/}', '', content, flags=re.DOTALL)
    
    open_divs = len(re.findall(r'<div\b[^>]*[^/]>', content))
    close_divs = len(re.findall(r'</div>', content))
    self_closing = len(re.findall(r'<div\b[^>]*/>', content))

    print(f"Open: {open_divs}")
    print(f"Close: {close_divs}")
    print(f"Self-Closing: {self_closing}")
    print(f"Diff: {open_divs - close_divs}")

check_balance('client/src/pages/TechnicianDashboard.jsx')
