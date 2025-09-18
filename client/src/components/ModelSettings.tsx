'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

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

interface ModelsByProvider {
  [provider: string]: Model[];
}

const ModelSettings = ({
  isOpen,
  onOpenChange,
  models,
  selectedModels,
  onSelectedModelsChange,
}: ModelSettingsProps) => {
  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped: ModelsByProvider = {};

    models.forEach(model => {
      // Extract provider from model ID (e.g., 'openai/gpt-4o' -> 'openai')
      const provider = model.id.includes('/')
        ? model.id.split('/')[0]
        : 'Other';

      if (!grouped[provider]) {
        grouped[provider] = [];
      }
      grouped[provider].push(model);
    });

    return grouped;
  }, [models]);

  // Sort providers for consistent display
  const sortedProviders = useMemo(() => {
    return Object.keys(modelsByProvider).sort((a, b) => {
      // Put "Other" at the end
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
  }, [modelsByProvider]);
  const handleModelToggle = (modelName: string) => {
    const isSelected = selectedModels.includes(modelName);
    if (isSelected) {
      // Prevent deselecting if it's the only selected model
      if (selectedModels.length > 1) {
        onSelectedModelsChange(selectedModels.filter(m => m !== modelName));
      }
    } else {
      onSelectedModelsChange([...selectedModels, modelName]);
    }
  };

  const handleSelectAll = () => {
    if (selectedModels.length === models.length) {
      // When deselecting all, keep at least one model selected (first one)
      onSelectedModelsChange([models[0]?.name].filter(Boolean));
    } else {
      onSelectedModelsChange(models.map(m => m.name));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select AI Models</DialogTitle>
          <DialogDescription>
            Choose the AI models you want to compare. You can select multiple models to see their responses side by side.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-sm font-medium">Available Models</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedModels.length === models.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar">
            {sortedProviders.map((provider) => (
              <div key={provider} className="space-y-3">
                <h4 className="text-sm font-semibold text-primary capitalize sticky top-0 bg-background py-2 border-b">
                  {provider === 'Other' ? 'Other Models' : `${provider} Models`}
                </h4>
                <div className="space-y-2">
                  {modelsByProvider[provider].map((model) => {
                    const isSelected = selectedModels.includes(model.name);
                    const isLastSelected = isSelected && selectedModels.length === 1;

                    return (
                      <div
                        key={model.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                          isLastSelected ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <Checkbox
                          id={model.id}
                          checked={isSelected}
                          onChange={() => handleModelToggle(model.name)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={model.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {model.name}
                            {isLastSelected && (
                              <span className="ml-2 text-xs text-blue-600 font-normal">(Required)</span>
                            )}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Selected models summary */}
          <div className="px-6 pb-6 space-y-3">
            {selectedModels.length === 0 && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                Select at least one model to start comparing responses.
              </div>
            )}

            {selectedModels.length > 0 && (
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                {selectedModels.length} model{selectedModels.length === 1 ? '' : 's'} selected: {selectedModels.join(', ')}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelSettings;