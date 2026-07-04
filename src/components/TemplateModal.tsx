import React from "react";
import { templates, type Template } from "../utils/templates";
import type { IconType } from "react-icons";
import { SiJavascript, SiReact, SiMui, SiVuedotjs, SiSvelte } from "react-icons/si";

// Map icon names to React icon components
const iconMap: Record<string, IconType> = {
  javascript: SiJavascript,
  react: SiReact,
  mui: SiMui,
  vue: SiVuedotjs,
  svelte: SiSvelte,
};

// Map icon names to their brand colors
const iconColors: Record<string, string> = {
  javascript: "#F7DF1E", // JavaScript yellow
  react: "#61DAFB",      // React blue
  mui: "#007FFF",        // Material UI blue
  vue: "#42B883",        // Vue green
  svelte: "#FF3E00",     // Svelte orange
};

// Map icon names to their background colors (lighter versions)
const backgroundColors: Record<string, string> = {
  javascript: "#FFFBEA", // Light yellow
  react: "#E6F7FF",      // Light blue
  mui: "#E3F2FD",        // Light Material UI blue
  vue: "#E8F5E9",        // Light green
  svelte: "#FFE9E3",     // Light orange
};

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const handleSelect = (template: Template) => {
    const confirm = window.confirm(
      `Switch to ${template.name} template?\n\nThis will replace all your current files. This action cannot be undone.`
    );
    if (confirm) {
      onSelectTemplate(template);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Choose a Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const bgColor = backgroundColors[template.icon] || "#FFFFFF";
              const borderColor = iconColors[template.icon];
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="flex flex-col items-start p-4 border-2 rounded-lg hover:shadow-lg transition-all text-left group relative overflow-hidden"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor ? `${borderColor}40` : "#E5E7EB",
                  }}
                >
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const IconComponent = iconMap[template.icon];
                    const iconColor = iconColors[template.icon];
                    return IconComponent ? (
                      <IconComponent
                        className="text-3xl transition-all duration-200"
                        style={{ color: iconColor }}
                      />
                    ) : (
                      <span className="text-3xl">{template.icon}</span>
                    );
                  })()}
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {template.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-700">{template.description}</p>
                {Object.keys(template.packages).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.keys(template.packages).map((pkg) => (
                      <span
                        key={pkg}
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={{
                          backgroundColor: iconColors[template.icon] + "20",
                          color: iconColors[template.icon],
                          border: `1px solid ${iconColors[template.icon]}40`,
                        }}
                      >
                        {pkg}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 Tip: You can always switch templates later or install packages
            manually
          </p>
        </div>
      </div>
    </div>
  );
};
