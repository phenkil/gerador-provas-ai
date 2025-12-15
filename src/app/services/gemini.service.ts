import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'openai';
}

@Injectable({
  providedIn: 'root'
})
export class ContentGeneratorService {

  constructor(private http: HttpClient) {}

  generateExam(apiKey: string, model: AIModel, meta: any): Observable<string> {
    const prompt = this.buildPrompt(meta);

    if (model.provider === 'google') {
      return this.callGemini(apiKey, model.id, prompt);
    } else {
      return this.callOpenAI(apiKey, model.id, prompt);
    }
  }

  // --- LÓGICA GOOGLE GEMINI ---
  private callGemini(apiKey: string, modelId: string, prompt: string): Observable<string> {
    const cleanModelId = modelId.startsWith('models/') ? modelId : modelId;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}:generateContent?key=${apiKey}`;
    const body = { contents: [{ parts: [{ text: prompt }] }] };

    return this.http.post<any>(url, body).pipe(
      map(res => {
        if (!res.candidates || !res.candidates[0].content) throw new Error('A IA não gerou resposta válida.');
        return this.cleanMarkdown(res.candidates[0].content.parts[0].text);
      }),
      catchError(this.handleError)
    );
  }

  // --- LÓGICA OPENAI ---
  private callOpenAI(apiKey: string, modelId: string, prompt: string): Observable<string> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` });
    const body = {
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(res => {
        if (!res.choices || !res.choices[0].message) throw new Error('A IA não gerou resposta válida.');
        return this.cleanMarkdown(res.choices[0].message.content);
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let userMessage = 'Erro desconhecido.';
    let technicalDetails = error.message;

    if (error.url) {
      technicalDetails = error.url.replace(/key=([^&]*)/i, 'key=HIDDEN_API_KEY');
    }

    if (error.status === 400) userMessage = 'Requisição Inválida.';
    else if (error.status === 401 || error.status === 403) userMessage = 'Chave de API inválida.';
    else if (error.status === 404) userMessage = 'Modelo não encontrado. Troque de modelo.';
    else if (error.status === 429) userMessage = 'Muitas requisições. Aguarde um momento.';
    else if (error.status >= 500) userMessage = 'Erro no servidor da IA.';
    
    return throwError(() => ({ friendlyMessage: userMessage, safeDetails: technicalDetails }));
  }

  private cleanMarkdown(text: string): string {
    return text.replace(/```html/g, '').replace(/```/g, '');
  }

  // 👇 AQUI ESTÁ A ALTERAÇÃO CRÍTICA PARA O BOTÃO 👇
  private buildPrompt(meta: any): string {
    return `
      Atue como um desenvolvedor Front-End Sênior.
      Crie um arquivo HTML5 completo (Single File Application) contendo CSS interno e JavaScript.
      
      DADOS DA PROVA:
      - Matéria: ${meta.materia}
      - Assunto: ${meta.assunto}
      - Ano Escolar: ${meta.ano}

      REQUISITOS OBRIGATÓRIOS DO CÓDIGO HTML/JS:
      1. Gere exatamente 10 questões de múltipla escolha.
      2. Cada questão deve ter 5 alternativas. Use <input type="radio"> ou checkbox com comportamento de radio.
      3. Adicione um botão com id="btnCorrigir" no final da página.
      
      LÓGICA JAVASCRIPT CRÍTICA (Implemente isso no script):
      1. O botão 'btnCorrigir' deve iniciar com o atributo 'disabled' (desabilitado).
      2. Adicione um 'EventListener' de mudança (change) em TODOS os inputs das questões.
      3. A cada clique/mudança em qualquer opção, o script deve verificar quantas questões foram respondidas.
      4. O script SÓ DEVE REMOVER o atributo 'disabled' do botão quando o usuário tiver marcado uma resposta em TODAS as 10 questões.
      5. Ao clicar no botão (quando habilitado):
         - Bloqueie todos os inputs (disabled).
         - Pinte o fundo da resposta correta de verde claro (#d4edda).
         - Pinte o fundo da resposta marcada errada de vermelho claro (#f8d7da).
         - Exiba a nota final (Ex: 8/10) em destaque.

      ESTILO (CSS):
      - Design moderno, limpo, cards brancos com sombra suave, fundo cinza claro.
      - O botão desabilitado deve parecer visualmente inativo (cinza, sem cursor pointer).
      
      SAÍDA:
      - Retorne APENAS o código HTML cru. Não use blocos de markdown (\`\`\`).
    `;
  }
}