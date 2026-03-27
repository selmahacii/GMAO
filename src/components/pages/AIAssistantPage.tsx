'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Send,
  Mic,
  Sparkles,
  Wrench,
  AlertTriangle,
  FileText,
  Lightbulb,
  CheckCircle,
  Clock,
  Zap,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  woData?: any;
  rcaData?: any;
}

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-wo', input: input }),
      });
      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `J'ai analysé votre demande. Voici les informations extraites:`,
        timestamp: new Date(),
        woData: data.workOrder,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Wrench, label: 'Créer un OT', prompt: 'Créer un ordre de travail pour ' },
    { icon: AlertTriangle, label: 'Analyser une panne', prompt: 'Analyser la panne de ' },
    { icon: FileText, label: 'Générer un rapport', prompt: 'Générer un rapport de maintenance pour ' },
    { icon: Lightbulb, label: 'Suggestions MP', prompt: 'Suggérer des améliorations pour ' },
  ];

  const exampleInputs = [
    'La pompe de circulation B12 fait un bruit anormal depuis ce matin, vibrations excessives',
    'Le compresseur d\'air a une fuite d\'huile au niveau du joint',
    'Surchauffe détectée sur le moteur du convoyeur principal',
    'Le transformateur TGBT-03 montre des signes de défaillance électrique',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-green-600" />
            Assistant IA
          </h1>
          <p className="text-gray-500">Création d'OTs en langage naturel et analyse intelligente</p>
        </div>
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Sparkles className="h-3 w-3 mr-1" />
          Moteur Analytique
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chat">Conversation</TabsTrigger>
          <TabsTrigger value="rca">Analyse Causes Racines</TabsTrigger>
          <TabsTrigger value="reports">Génération Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Création d'OT par IA</CardTitle>
                  <CardDescription>Décrivez le problème en langage naturel</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 pr-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Démarrez une conversation</p>
                        <p className="text-sm">Décrivez un problème et l'IA créera un OT structuré</p>
                        
                        <div className="mt-6 space-y-2">
                          <p className="text-xs text-gray-400">Exemples:</p>
                          {exampleInputs.map((ex, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="w-full text-left justify-start h-auto py-2"
                              onClick={() => setInput(ex)}
                            >
                              <span className="truncate">{ex}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              
                              {msg.woData && (
                                <Card className="mt-3 bg-white dark:bg-gray-900">
                                  <CardContent className="p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Wrench className="h-4 w-4 text-green-600" />
                                      <span className="font-medium">OT suggéré</span>
                                      <Badge variant="outline" className="ml-auto">
                                        Confiance: {(msg.woData.confidence * 100).toFixed(0)}%
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Titre:</span>
                                        <p className="font-medium">{msg.woData.title}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Priorité:</span>
                                        <p>{msg.woData.priority}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Type:</span>
                                        <p>{msg.woData.woType}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Durée estimée:</span>
                                        <p>{msg.woData.estimatedDurationHours}h</p>
                                      </div>
                                    </div>
                                    {msg.woData.checklistItems && (
                                      <div className="pt-2 border-t">
                                        <span className="text-xs text-gray-500">Checklist:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {msg.woData.checklistItems.map((item: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                              {item}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <Button size="sm" className="w-full mt-2">
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Créer cet OT
                                    </Button>
                                  </CardContent>
                                </Card>
                              )}
                              
                              <p className="text-xs opacity-50 mt-1">
                                {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Input
                      placeholder="Décrivez le problème..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSend} disabled={loading}>
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setInput(action.prompt)}
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Capacités</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>Création OT en langage naturel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>Analyse causes racines (RCA)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>Génération rapports narratifs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-green-500" />
                      <span>Suggestions maintenance</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rca">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Causes Racines</CardTitle>
              <CardDescription>Sélectionnez un équipement pour analyser l'historique des pannes</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Analyse RCA par IA</p>
              <p className="text-sm">Analyse FMEA des pannes récurrentes</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Génération de Rapports</CardTitle>
              <CardDescription>Rapports narratifs automatiques pour la direction</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Génération de rapports IA</p>
              <p className="text-sm">Rapports mensuels, trimestriels, annuels</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
