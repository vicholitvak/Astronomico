import re
import csv
import os
import zipfile
import tarfile
from pathlib import Path
from collections import defaultdict
import json

class EmailExtractor:
    def __init__(self):
        self.all_emails = set()
        self.email_stats = defaultdict(int)
        self.email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
    def extract_from_takeout(self, takeout_path):
        """Procesa archivos de Google Takeout (ZIP o TGZ)"""
        print(f"📂 Procesando: {takeout_path}")
        
        if takeout_path.endswith('.zip'):
            self.process_zip(takeout_path)
        elif takeout_path.endswith('.tgz') or takeout_path.endswith('.tar.gz'):
            self.process_tar(takeout_path)
        else:
            print("⚠️ Formato no reconocido. Esperado: .zip, .tgz, o .tar.gz")
            
    def process_zip(self, zip_path):
        """Procesa archivo ZIP grande de forma eficiente"""
        with zipfile.ZipFile(zip_path, 'r') as zf:
            file_list = zf.namelist()
            print(f"📦 Archivos en ZIP: {len(file_list)}")
            
            for file_name in file_list:
                # Buscar archivos relevantes
                if any(x in file_name.lower() for x in ['mail', 'gmail', 'mbox', '.eml', '.json']):
                    print(f"  ➜ Procesando: {file_name}")
                    try:
                        with zf.open(file_name) as f:
                            # Leer en chunks para archivos grandes
                            self.process_file_content(f, file_name)
                    except Exception as e:
                        print(f"    ❌ Error: {e}")
                        
    def process_tar(self, tar_path):
        """Procesa archivo TAR.GZ grande"""
        with tarfile.open(tar_path, 'r:gz') as tf:
            for member in tf.getmembers():
                if member.isfile():
                    file_name = member.name
                    if any(x in file_name.lower() for x in ['mail', 'gmail', 'mbox', '.eml', '.json']):
                        print(f"  ➜ Procesando: {file_name}")
                        try:
                            f = tf.extractfile(member)
                            if f:
                                self.process_file_content(f, file_name)
                        except Exception as e:
                            print(f"    ❌ Error: {e}")
                            
    def process_file_content(self, file_obj, file_name):
        """Procesa contenido del archivo en chunks"""
        chunk_size = 1024 * 1024  # 1MB chunks
        
        if file_name.endswith('.json'):
            # Para archivos JSON (ej: contactos de Google)
            try:
                content = file_obj.read().decode('utf-8', errors='ignore')
                data = json.loads(content)
                self.extract_from_json(data)
            except:
                pass
        else:
            # Para archivos de texto/email
            while True:
                try:
                    chunk = file_obj.read(chunk_size)
                    if not chunk:
                        break
                    
                    # Decodificar chunk
                    if isinstance(chunk, bytes):
                        text = chunk.decode('utf-8', errors='ignore')
                    else:
                        text = chunk
                    
                    # Buscar emails
                    found_emails = re.findall(self.email_pattern, text)
                    for email in found_emails:
                        email_lower = email.lower()
                        self.all_emails.add(email_lower)
                        self.email_stats[email_lower] += 1
                        
                except Exception as e:
                    break
                    
    def extract_from_json(self, data):
        """Extrae emails de estructuras JSON (contactos, etc)"""
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str) and '@' in value:
                    emails = re.findall(self.email_pattern, value)
                    for email in emails:
                        self.all_emails.add(email.lower())
                        self.email_stats[email.lower()] += 1
                elif isinstance(value, (dict, list)):
                    self.extract_from_json(value)
        elif isinstance(data, list):
            for item in data:
                self.extract_from_json(item)
                
    def filter_client_emails(self):
        """Filtra emails de clientes reales"""
        exclude_patterns = [
            'noreply', 'no-reply', 'donotreply',
            'mailer-daemon', 'postmaster', 'abuse',
            'notification', 'alert', 'system',
            'support', 'info@', 'admin@', 'webmaster@',
            'newsletter', 'marketing', 'sales@',
            'factura', 'invoice', 'billing'
        ]
        
        # Tu dominio/emails (MODIFICAR)
        your_domains = ['atacamanightsky', 'tudominio.com']
        
        filtered = []
        for email in self.all_emails:
            # Excluir emails de sistema
            if any(pattern in email for pattern in exclude_patterns):
                continue
            
            # Excluir tus propios emails
            if any(domain in email for domain in your_domains):
                continue
                
            # Solo emails que aparecen más de una vez (probablemente clientes reales)
            if self.email_stats[email] >= 1:
                filtered.append(email)
                
        return filtered
    
    def save_results(self, output_dir='.'):
        """Guarda resultados en múltiples formatos"""
        client_emails = self.filter_client_emails()
        
        print(f"\n📊 RESULTADOS:")
        print(f"  • Total emails encontrados: {len(self.all_emails)}")
        print(f"  • Emails de clientes filtrados: {len(client_emails)}")
        
        # 1. CSV detallado
        csv_file = os.path.join(output_dir, 'clientes_emails.csv')
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Email', 'Veces_Contactado', 'Nombre_Estimado', 'Notas'])
            
            for email in sorted(client_emails):
                # Estimar nombre desde email
                name_part = email.split('@')[0]
                name_part = re.sub(r'[._-]', ' ', name_part)
                name_estimated = name_part.title()
                
                times_seen = self.email_stats[email]
                writer.writerow([email, times_seen, name_estimated, 'Cliente histórico'])
        
        print(f"  ✅ CSV guardado: {csv_file}")
        
        # 2. TXT simple para importar
        txt_file = os.path.join(output_dir, 'emails_importar.txt')
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(client_emails)))
        
        print(f"  ✅ TXT guardado: {txt_file}")
        
        # 3. Segmentos por frecuencia
        vip_file = os.path.join(output_dir, 'clientes_vip.txt')
        regular_file = os.path.join(output_dir, 'clientes_regular.txt')
        
        vip_clients = [e for e in client_emails if self.email_stats[e] >= 3]
        regular_clients = [e for e in client_emails if self.email_stats[e] < 3]
        
        with open(vip_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(vip_clients)))
        
        with open(regular_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(regular_clients)))
            
        print(f"  ✅ VIP ({len(vip_clients)}): {vip_file}")
        print(f"  ✅ Regular ({len(regular_clients)}): {regular_file}")
        
        # Mostrar muestra
        print(f"\n📧 Muestra de emails encontrados:")
        for email in list(client_emails)[:10]:
            print(f"  • {email} (contactado {self.email_stats[email]} veces)")

def main():
    print("=" * 50)
    print("   EXTRACTOR DE EMAILS - GOOGLE TAKEOUT")
    print("=" * 50)
    
    extractor = EmailExtractor()
    
    # Buscar archivos de Takeout en el directorio actual
    takeout_files = list(Path('.').glob('takeout*.zip')) + \
                   list(Path('.').glob('takeout*.tgz')) + \
                   list(Path('.').glob('takeout*.tar.gz'))
    
    if takeout_files:
        print(f"\n📁 Archivos Takeout encontrados:")
        for i, file in enumerate(takeout_files, 1):
            print(f"  {i}. {file.name} ({file.stat().st_size / 1024**3:.1f} GB)")
        
        choice = input("\n¿Cuál procesar? (número o 'todos'): ").strip()
        
        if choice.lower() == 'todos':
            for file in takeout_files:
                extractor.extract_from_takeout(str(file))
        else:
            try:
                idx = int(choice) - 1
                extractor.extract_from_takeout(str(takeout_files[idx]))
            except:
                print("❌ Opción inválida")
                return
    else:
        # Entrada manual
        file_path = input("\n📂 Ruta al archivo Takeout (.zip/.tgz): ").strip()
        if os.path.exists(file_path):
            extractor.extract_from_takeout(file_path)
        else:
            print("❌ Archivo no encontrado")
            return
    
    # Guardar resultados
    if extractor.all_emails:
        extractor.save_results()
        
        print("\n🎯 PRÓXIMOS PASOS:")
        print("  1. Revisa el archivo 'clientes_emails.csv'")
        print("  2. Importa 'emails_importar.txt' en tu herramienta de email")
        print("  3. Usa 'clientes_vip.txt' para campañas especiales")
        print("\n💡 Herramientas recomendadas para email marketing:")
        print("  • Mailchimp (gratis hasta 500 contactos)")
        print("  • Brevo/SendinBlue (gratis 300 emails/día)")
        print("  • MailerLite (gratis hasta 1000 suscriptores)")

if __name__ == "__main__":
    main()