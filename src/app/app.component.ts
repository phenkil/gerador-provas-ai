import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContentGeneratorService, AIModel } from './services/gemini.service';

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

  examData = {
    materia: 'FILOSOFIA',
    assunto: 'Filosofia e arte no Renascimento',
    ano: '7º ano do fundamental'
  };

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
    // 1. Identifica qual chave usar com base no modelo escolhido
    const currentKey = this.selectedModel.provider === 'google' 
      ? this.GOOGLE_KEY 
      : this.OPENAI_KEY;

    // 2. Validação simples para ver se você não esqueceu de colar
    if (!currentKey || currentKey.includes("COLE_SUA_CHAVE")) {
      this.setStatus('Erro: Configure as chaves no arquivo app.component.ts', 'error');
      return;
    }

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
    a.download = `Prova_${new Date().getTime()}.html`;
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