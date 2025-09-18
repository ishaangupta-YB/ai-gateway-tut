'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

interface Model {
  id: string;
  name: string;
}

interface ModelSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  models: Model[];
  selectedModels: string[];
  onSelectedModelsChange: (models: string[]) => void;
}

const ModelSettings = ({
  isOpen,
  onOpenChange,
  models,
  selectedModels,
  onSelectedModelsChange,
}: ModelSettingsProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    if (!searchTerm) return models;
    return models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [models, searchTerm]);

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped: { [provider: string]: Model[] } = {};

    filteredModels.forEach(model => {
      const provider = model.id.includes('/')
        ? model.id.split('/')[0]
        : 'custom';

      if (!grouped[provider]) {
        grouped[provider] = [];
      }
      grouped[provider].push(model);
    });

    // Sort providers: gemini, openai, anthropic, alibaba, then alphabetically
    const providerOrder = ['google', 'openai', 'anthropic', 'alibaba'];
    const sortedProviders = Object.keys(grouped).sort((a, b) => {
      const aIndex = providerOrder.indexOf(a);
      const bIndex = providerOrder.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return { grouped, sortedProviders };
  }, [filteredModels]);
  const handleModelToggle = (modelName: string) => {
    const isSelected = selectedModels.includes(modelName);
    if (isSelected) {
      if (selectedModels.length > 1) {
        onSelectedModelsChange(selectedModels.filter(m => m !== modelName));
      }
    } else {
      if (selectedModels.length < 6) {
        onSelectedModelsChange([...selectedModels, modelName]);
      }
    }
  };

  const isModelSelected = (modelName: string) => selectedModels.includes(modelName);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} >
      <DialogContent className="flex flex-col w-full p-0 md:max-h-[500px]  md:max-w-[700px] lg:max-w-[800px] border border-border bg-popover">
        <DialogHeader className="space-y-4 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-popover-foreground">
              Select up to 6 models
            </DialogTitle>
            <DialogClose 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            > 
            </DialogClose>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Selected: {selectedModels.length}/6
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {modelsByProvider.sortedProviders.map((provider) => (
            <div key={provider}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground capitalize">
                  {provider === 'google' ? 'Google (Gemini)' : provider}
                </h3>
                <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                  {modelsByProvider.grouped[provider].length}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {modelsByProvider.grouped[provider].map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleModelToggle(model.name)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isModelSelected(model.name)
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-muted-foreground'
                    }`}
                  >
                    <Checkbox
                      checked={isModelSelected(model.name)}
                      onCheckedChange={() => handleModelToggle(model.name)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium text-card-foreground truncate">
                      {model.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelSettings;