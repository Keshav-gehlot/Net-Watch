import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Trash2, Edit } from "lucide-react";
import { AlertSeverity } from "@/utils/alerting";

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  conditions: RuleCondition[];
  actions: RuleAction[];
  cooldownMinutes: number;
  created: number;
  modified: number;
  author: string;
  tags: string[];
}

export interface RuleCondition {
  id: string;
  type: "protocol" | "sourceIp" | "destIp" | "sourcePort" | "destPort" | "packetSize" | "frequency" | "payload";
  operator: "equals" | "notEquals" | "contains" | "regex" | "greater" | "less" | "between";
  value: string | number;
  value2?: string | number; // For "between" operator
  timeWindow?: number; // For frequency-based conditions (minutes)
}

export interface RuleAction {
  id: string;
  type: "alert" | "log" | "email" | "webhook" | "block";
  config: Record<string, any>;
}

interface CustomDetectionRulesProps {
  rules: DetectionRule[];
  onRuleAdd: (rule: DetectionRule) => void;
  onRuleUpdate: (rule: DetectionRule) => void;
  onRuleDelete: (ruleId: string) => void;
  onRuleToggle: (ruleId: string, enabled: boolean) => void;
}

export const CustomDetectionRules: React.FC<CustomDetectionRulesProps> = ({
  rules,
  onRuleAdd,
  onRuleUpdate,
  onRuleDelete,
  onRuleToggle
}) => {
  const [editingRule, setEditingRule] = useState<DetectionRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createNewRule = (): DetectionRule => ({
    id: crypto.randomUUID(),
    name: "",
    description: "",
    enabled: true,
    severity: "Medium",
    conditions: [{
      id: crypto.randomUUID(),
      type: "protocol",
      operator: "equals",
      value: "TCP"
    }],
    actions: [{
      id: crypto.randomUUID(),
      type: "alert",
      config: {}
    }],
    cooldownMinutes: 5,
    created: Date.now(),
    modified: Date.now(),
    author: "User",
    tags: []
  });

  const handleSaveRule = (rule: DetectionRule) => {
    if (editingRule) {
      onRuleUpdate({ ...rule, modified: Date.now() });
    } else {
      onRuleAdd(rule);
    }
    setEditingRule(null);
    setShowCreateForm(false);
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    const colors = {
      Low: "bg-blue-100 text-blue-800",
      Medium: "bg-yellow-100 text-yellow-800",
      High: "bg-orange-100 text-orange-800",
      Critical: "bg-red-100 text-red-800"
    };
    return colors[severity];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Detection Rules</h2>
          <p className="text-gray-600">Create and manage custom security detection rules</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={`${rule.enabled ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge className={getSeverityColor(rule.severity)}>
                      {rule.severity}
                    </Badge>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => onRuleToggle(rule.id, enabled)}
                    />
                  </div>
                  <p className="text-gray-600 text-sm">{rule.description}</p>
                  <div className="flex gap-2 mt-2">
                    {rule.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRuleDelete(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Conditions:</strong>
                  <ul className="mt-1 space-y-1">
                    {rule.conditions.map((condition) => (
                      <li key={condition.id} className="text-gray-600">
                        {condition.type} {condition.operator} {condition.value}
                        {condition.timeWindow && ` (${condition.timeWindow}min window)`}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Actions:</strong>
                  <ul className="mt-1 space-y-1">
                    {rule.actions.map((action) => (
                      <li key={action.id} className="text-gray-600">
                        {action.type}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                Cooldown: {rule.cooldownMinutes} minutes | 
                Created: {new Date(rule.created).toLocaleDateString()} | 
                Modified: {new Date(rule.modified).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingRule) && (
        <RuleEditForm
          rule={editingRule || createNewRule()}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
};

interface RuleEditFormProps {
  rule: DetectionRule;
  onSave: (rule: DetectionRule) => void;
  onCancel: () => void;
}

const RuleEditForm: React.FC<RuleEditFormProps> = ({ rule, onSave, onCancel }) => {
  const [formRule, setFormRule] = useState<DetectionRule>(rule);

  const addCondition = () => {
    setFormRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        id: crypto.randomUUID(),
        type: "protocol",
        operator: "equals",
        value: ""
      }]
    }));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setFormRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="fixed inset-4 z-50 bg-white shadow-2xl overflow-auto">
      <CardHeader>
        <CardTitle>{rule.name ? 'Edit Rule' : 'Create New Rule'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ruleName">Rule Name *</Label>
            <Input
              id="ruleName"
              value={formRule.name}
              onChange={(e) => setFormRule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
            />
          </div>
          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={formRule.severity}
              onValueChange={(value) => setFormRule(prev => ({ ...prev, severity: value as AlertSeverity }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formRule.description}
            onChange={(e) => setFormRule(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this rule detects"
          />
        </div>

        {/* Conditions */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <Label>Conditions</Label>
            <Button variant="outline" size="sm" onClick={addCondition}>
              <Plus className="w-4 h-4 mr-1" />
              Add Condition
            </Button>
          </div>
          <div className="space-y-3">
            {formRule.conditions.map((condition, index) => (
              <div key={condition.id} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                <div className="col-span-3">
                  <Select
                    value={condition.type}
                    onValueChange={(value) => updateCondition(index, { type: value as RuleCondition['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protocol">Protocol</SelectItem>
                      <SelectItem value="sourceIp">Source IP</SelectItem>
                      <SelectItem value="destIp">Destination IP</SelectItem>
                      <SelectItem value="sourcePort">Source Port</SelectItem>
                      <SelectItem value="destPort">Destination Port</SelectItem>
                      <SelectItem value="packetSize">Packet Size</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                      <SelectItem value="payload">Payload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value as RuleCondition['operator'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="notEquals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                      <SelectItem value="greater">Greater</SelectItem>
                      <SelectItem value="less">Less</SelectItem>
                      <SelectItem value="between">Between</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Value"
                  />
                </div>
                {condition.operator === "between" && (
                  <div className="col-span-2">
                    <Input
                      value={condition.value2 || ""}
                      onChange={(e) => updateCondition(index, { value2: e.target.value })}
                      placeholder="End value"
                    />
                  </div>
                )}
                {condition.type === "frequency" && (
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={condition.timeWindow || ""}
                      onChange={(e) => updateCondition(index, { timeWindow: Number(e.target.value) })}
                      placeholder="Minutes"
                    />
                  </div>
                )}
                <div className="col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cooldown">Cooldown (minutes)</Label>
            <Input
              id="cooldown"
              type="number"
              value={formRule.cooldownMinutes}
              onChange={(e) => setFormRule(prev => ({ ...prev, cooldownMinutes: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formRule.tags.join(", ")}
              onChange={(e) => setFormRule(prev => ({ 
                ...prev, 
                tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
              }))}
              placeholder="malware, network-scan, suspicious"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={() => onSave(formRule)} disabled={!formRule.name}>
            Save Rule
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
