import sys
import zipfile
import re

def extract_all(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml').decode('utf-8')
            text = re.sub(r'<[^>]+>', ' ', xml_content)
            text = re.sub(r'\s+', ' ', text).strip()
            with open('.tmp/parsed_doc.txt', 'w', encoding='utf-8') as f:
                f.write(text)
    except Exception as e:
        print(e)

if __name__ == '__main__':
    extract_all(sys.argv[1])
