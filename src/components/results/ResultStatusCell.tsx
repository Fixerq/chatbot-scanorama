
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultStatusCellProps {
  status: string | undefined;
  hasChatbot: boolean;
  technologies: string;
  lastChecked?: string;
  chatSolutions?: string[];
  confidence?: number;
  verificationStatus?: string;
  onResultUpdate?: () => void;
  advancedDetection?: {
    confidence: string;
    evidence: string[];
    falsePositiveChecks: string[];
  };
}

const ResultStatusCell = ({ 
  status, 
  hasChatbot, 
  technologies, 
  lastChecked, 
  chatSolutions,
  confidence,
  verificationStatus,
  onResultUpdate,
  advancedDetection
}: ResultStatusCellProps) => {
  const getChatbotStatusColor = (status: string | undefined, hasChatbot: boolean, confidence?: number) => {
    if (!status) return 'secondary';
    
    // For analysis in progress states
    if (status.toLowerCase().includes('analyzing') || 
        status.toLowerCase().includes('starting') || 
        status.toLowerCase().includes('preparing')) {
      return 'default';
    }
    
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (status === 'Processing...') return 'secondary';
    if (hasChatbot) {
      // If we have confidence data, use it to determine the color
      if (confidence !== undefined) {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.5) return 'success';
        if (confidence >= 0.3) return 'secondary'; 
        return 'secondary';
      }
      return 'success';
    }
    return 'secondary';
  };

  // Format the display text to be more user-friendly
  const getDisplayText = () => {
    // Handle analysis in progress states
    if (status?.toLowerCase().includes('preparing')) return 'Preparing analysis...';
    if (status?.toLowerCase().includes('starting')) return 'Starting analysis...';
    if (status?.toLowerCase().includes('analyzing')) return 'Analyzing...';
    
    if (technologies === 'Custom Chat') {
      return 'Website Chatbot';
    }
    if (status?.toLowerCase().includes('no chatbot')) {
      return 'No chatbot detected';
    }
    return technologies || 'Analyzing...';
  };

  // Add spinning animation for analysis in progress
  const isAnalyzing = status?.toLowerCase().includes('analyzing') || 
                    status?.toLowerCase().includes('starting') || 
                    status?.toLowerCase().includes('preparing');

  // Get confidence level text
  const getConfidenceText = (confidence?: number, advancedConfidence?: string) => {
    // If we have advanced detection results, use those
    if (advancedConfidence) {
      if (advancedConfidence === 'high') return 'Very high confidence';
      if (advancedConfidence === 'medium') return 'High confidence';
      if (advancedConfidence === 'low') return 'Medium confidence';
      return 'Low confidence';
    }
    
    // Otherwise, use the numeric confidence
    if (confidence === undefined) return '';
    if (confidence >= 0.8) return 'Very high confidence';
    if (confidence >= 0.5) return 'High confidence';
    if (confidence >= 0.3) return 'Medium confidence';
    if (confidence >= 0.1) return 'Low confidence';
    return 'Very low confidence';
  };

  // Improved tooltip content with verification status
  const formatTooltipContent = () => {
    const content = [];
    
    // Add analysis status information for in-progress analysis
    if (isAnalyzing) {
      content.push('Analysis in progress...');
      content.push('Scanning website for chatbot indicators');
      return content.join('\n');
    }
    
    if (lastChecked) {
      content.push(`Last checked: ${new Date(lastChecked).toLocaleString()}`);
    }
    
    if (status === 'Processing...') {
      content.push('Analysis in progress...');
    } else if (status?.toLowerCase().includes('error')) {
      content.push(`Error: ${status}`);
    } else if (status?.toLowerCase().includes('no chatbot')) {
      content.push('No chatbot detected (verified)');
      
      // Add any false positive checks from advanced detection
      if (advancedDetection?.falsePositiveChecks && advancedDetection.falsePositiveChecks.length > 0) {
        content.push('');
        content.push('Verification notes:');
        advancedDetection.falsePositiveChecks.forEach(check => {
          content.push(`- ${check}`);
        });
      }
    } else if (hasChatbot && chatSolutions && chatSolutions.length > 0) {
      // Add confidence information
      if (advancedDetection?.confidence) {
        content.push(getConfidenceText(undefined, advancedDetection.confidence));
      } else if (confidence !== undefined) {
        content.push(getConfidenceText(confidence));
      }
      
      if (verificationStatus) {
        content.push(`Verification: ${verificationStatus}`);
      }
      
      // Add chatbot evidence if available
      if (advancedDetection?.evidence && advancedDetection.evidence.length > 0) {
        content.push('');
        content.push('Detection evidence:');
        advancedDetection.evidence.slice(0, 3).forEach(evidence => {
          content.push(`- ${evidence}`);
        });
        if (advancedDetection.evidence.length > 3) {
          content.push(`- Plus ${advancedDetection.evidence.length - 3} more indicators`);
        }
      }
      
      if (chatSolutions.length === 1) {
        let solution = chatSolutions[0];
        if (solution === "Website Chatbot" || solution === "Custom Chat") {
          content.push(`Website has a custom chatbot solution`);
        } else {
          content.push(`Detected ${solution} chatbot`);
        }
      } else {
        const primary = chatSolutions[0] === "Custom Chat" ? "Website Chatbot" : chatSolutions[0];
        content.push(`Primary: ${primary}`);
        
        const additional = chatSolutions.slice(1).map(s => s === "Custom Chat" ? "Website Chatbot" : s);
        content.push(`Additional providers: ${additional.join(', ')}`);
      }
    } else if (status) {
      content.push(`Status: ${status}`);
    }
    
    if (onResultUpdate) {
      content.push('Click to refresh analysis with advanced verification');
    }
    
    return content.join('\n');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onResultUpdate) {
      console.log('ResultStatusCell clicked, triggering update with enhanced verification');
      onResultUpdate();
    }
  };

  return (
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={handleClick} 
              className={`inline-block ${onResultUpdate ? 'cursor-pointer hover:opacity-80' : 'cursor-help'}`}
            >
              <Badge 
                variant={getChatbotStatusColor(status, hasChatbot, confidence)}
                className={`${isAnalyzing ? 'animate-pulse' : ''} px-3 py-1`}
              >
                {getDisplayText()}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] whitespace-pre-line">
            <p>{formatTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};

export default ResultStatusCell;
