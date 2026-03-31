import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContentGeneratorService, AIModel } from './services/gemini.service';
// Importe AQUI:
import { environment } from '../environments/environment';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  // ==============================================================
  // 👇 COLE SUAS CHAVES FIXAS AQUI
  // ==============================================================
  private readonly GOOGLE_KEY = "SUA_NOVA_KEY_GOOGLE_AQUI"; // Ex: AIza...
  private readonly OPENAI_KEY = "SUA_KEY_OPENAI_AQUI"; // Ex: sk-...
  // ==============================================================

  availableModels: AIModel[] = [
    { id: 'gemini-2.5-flash', name: '⚡ Gemini 2.5 Flash', provider: 'google' },
    { id: 'gemini-2.5-pro', name: '🧠 Gemini 2.5 Pro', provider: 'google' },
    { id: 'gemini-2.0-flash-lite', name: '🚀 Gemini 2.0 Flash Lite', provider: 'google' },
    { id: 'gpt-3.5-turbo', name: '🤖 ChatGPT 3.5', provider: 'openai' }
  ];

  selectedModel: AIModel = this.availableModels[0];

// ==========================================
  // NOVAS LISTAS PARA OS COMBOS
  // ==========================================
  materias: string[] = [
    'Arte',
    'Biologia',
    'Ciências',
    'Educação Física',
    'Filosofia',
    'Física',
    'Geografia',
    'História',
    'Língua Espanhola',
    'Língua Inglesa',
    'Língua Portuguesa',
    'Matemática',
    'Química',
    'Sociologia'
  ];

  anosEscolares: string[] = [
    '6º ano do Ensino Fundamental',
    '7º ano do Ensino Fundamental',
    '8º ano do Ensino Fundamental',
    '9º ano do Ensino Fundamental',
    '1º ano do Ensino Médio',
    '2º ano do Ensino Médio',
    '3º ano do Ensino Médio'
  ];

  // Valores padrão ajustados para casar com as listas
  examData = {
    materia: 'Filosofia', 
    assunto: 'Filosofia e arte no Renascimento', // Este continua sendo texto livre
    ano: '7º ano do Ensino Fundamental'
  };
  // ==========================================

  isLoading: boolean = false;
  progress: number = 0;
  statusMessage: string = '';
  generatedHtml: string = '';
  safeHtmlUrl: SafeHtml | null = null;
  activeTab: string = 'preview';
  private progressInterval: any;

  constructor(
    private generatorService: ContentGeneratorService,
    private sanitizer: DomSanitizer
  ) {}

  generate() {
    // Nova etapa de sanitização e validação
    const assuntoSanitizado = this.examData.assunto.replace(/[<>]/g, '').substring(0, 150);
	
	generate() {
    // Agora o sistema lê as chaves direto do arquivo de ambiente!
    const currentKey = this.selectedModel.provider === 'google' 
      ? environment.googleKey 
      : environment.openaiKey;

    if (!currentKey) {
      this.setStatus('Erro: API Key não configurada no environment.', 'error');
      return;
    }
    
    if (!assuntoSanitizado.trim()) {
      this.setStatus('Erro: O assunto é obrigatório e não pode conter caracteres especiais HTML.', 'error');
      return;
    }

    const safeExamData = {
      ...this.examData,
      assunto: assuntoSanitizado
    };

    this.startLoading();

    // 3. Chama o serviço passando a chave fixa
    this.generatorService.generateExam(currentKey, this.selectedModel, this.examData)
      .subscribe(
        (html) => {
          this.generatedHtml = html;
          this.safeHtmlUrl = this.sanitizer.bypassSecurityTrustHtml(html);
          this.stopLoading(true);
        },
        (err) => {
          console.error(err);
          this.setStatus('Erro: ' + err.message, 'error');
          this.stopLoading(false);
        }
      );
  }

  // ... (Mantenha as funções downloadExam, copyCode, startLoading, stopLoading iguais) ...
  
  downloadExam() {
    if (!this.generatedHtml) return;

    const blob = new Blob([this.generatedHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
	
	// Atualização na lógica de numeração no downloadExam()
    const storageValue = localStorage.getItem(storageKey);
    let ultimoNumero = parseInt(storageValue || '0', 10);
    
    // Se o usuário manipulou o LocalStorage e quebrou o número, reseta para 0
    if (isNaN(ultimoNumero)) {
      ultimoNumero = 0;
    }
    
    // 1. Limpa os textos para evitar caracteres inválidos no nome do arquivo do Windows/Mac
    // Mantém letras, números e o símbolo 'º'. Troca espaços por '_'
    const safeAno = this.examData.ano.replace(/[^a-zA-Z0-9º]/g, '_');
    const safeMateria = this.examData.materia.replace(/[^a-zA-Z0-9]/g, '_');
    
    // 2. Chave de armazenamento única para essa combinação de Ano e Matéria
    const storageKey = `contador_${safeAno}_${safeMateria}`;
    
    // 3. Lê o último número salvo (se for a primeira vez, assume 0)
    let ultimoNumero = parseInt(localStorage.getItem(storageKey) || '0', 10);
    
    // 4. Soma 1 para a nova prova
    let proximoNumero = ultimoNumero + 1;
    
    // 5. Salva o novo número de volta no navegador
    localStorage.setItem(storageKey, proximoNumero.toString());
    
    // 6. Formata o número para ter sempre 2 dígitos (01, 02, ..., 10, 11)
    const numeroFormatado = proximoNumero.toString().padStart(2, '0');
    
    // 7. Monta o nome final do arquivo: Ano_Materia_01.html
    const filename = `${safeAno}_${safeMateria}_${numeroFormatado}.html`;

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  copyCode() {
    const nav = navigator as any;
    if (nav.clipboard) {
        nav.clipboard.writeText(this.generatedHtml);
        alert('Copiado!');
    } else {
        alert('Erro: Clipboard não suportado.');
    }
  }

  startLoading() {
    this.isLoading = true;
    this.generatedHtml = '';
    this.progress = 0;
    this.setStatus(`Gerando com ${this.selectedModel.name}...`, 'loading');
    this.progressInterval = setInterval(() => {
      if (this.progress < 90) this.progress += 2;
    }, 200);
  }

  stopLoading(success: boolean) {
    clearInterval(this.progressInterval);
    this.isLoading = false;
    this.progress = success ? 100 : 0;
    if (success) this.setStatus('Sucesso!', 'success');
  }

  setStatus(msg: string, type: string) {
    this.statusMessage = msg;
  }
}
