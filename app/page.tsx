"use client";

// pages/index.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ModifierProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
}

const ModifierSwitch: React.FC<ModifierProps> = ({ label, checked, onCheckedChange, description }) => (
  <div className="flex items-center justify-between space-x-2">
    <div className="space-y-0.5">
      <Label>{label}</Label>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default function Home() {
  // Basic stats
  const [attacks, setAttacks] = useState(1);
  const [hit, setHit] = useState(3);
  const [wound, setWound] = useState(3);
  const [savingThrow, setSavingThrow] = useState(3);
  const [result, setResult] = useState(0);

  // Hit modifiers
  const [rerollHitsOfOne, setRerollHitsOfOne] = useState(false);
  const [rerollAllHits, setRerollAllHits] = useState(false);
  
  // Wound modifiers
  const [rerollWoundsOfOne, setRerollWoundsOfOne] = useState(false);
  const [rerollAllWounds, setRerollAllWounds] = useState(false);
  
  // Critical effect modifiers
  const [devastatingWounds, setDevastatingWounds] = useState(false);
  const [lethalHits, setLethalHits] = useState(false);
  const [sustainedHits, setSustainedHits] = useState(false);
  const [improvedAP, setImprovedAP] = useState(false);

  const updateValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    if (value >= 1 && value <= 6) {
      setter(value);
    }
  };

  // Calculate basic probability for a roll of X+
  const calculateProbability = (value: number): number => {
    return (7 - value) / 6;
  };

  // Calculate probability with rerolls
  const calculateWithReroll = (successProb: number, rerollAll: boolean, rerollOnes: boolean): number => {
    if (rerollAll) {
      // Reroll all failures
      const failProb = 1 - successProb;
      return successProb + (failProb * successProb);
    } else if (rerollOnes) {
      // Reroll only ones
      const oneInSixProb = 1/6;
      return successProb + (oneInSixProb * successProb);
    }
    return successProb;
  };

  useEffect(() => {
    let finalResult = 0;
    const baseAttacks = attacks;
    
    // Calculate hit probability with rerolls
    let hitProb = calculateProbability(hit);
    hitProb = calculateWithReroll(hitProb, rerollAllHits, rerollHitsOfOne);

    // Calculate wound probability with rerolls
    let woundProb = calculateProbability(wound);
    woundProb = calculateWithReroll(woundProb, rerollAllWounds, rerollWoundsOfOne);

    // Calculate save probability
    var saveProb = 0
    if (improvedAP) {
      saveProb = calculateProbability(savingThrow + 1);
    } else {
      saveProb = calculateProbability(savingThrow );
    }
    console.log(savingThrow, saveProb)

    // Initialize variables for tracking different wound paths
    let normalWounds = 0;
    let devastatingWoundCount = 0;
    let lethalHitCount = 0;
    let sustainedHitCount = 0;

    // Calculate hits that will move to wound rolls
    let successfulHits = baseAttacks * hitProb;

    // Add sustained hits (on successful hit rolls)
    if (sustainedHits) {
      sustainedHitCount = successfulHits * (1/6); // Add 1 additional hit on 6s
      successfulHits += sustainedHitCount;
    }

    // Process lethal hits (automatic wounds)
    if (lethalHits) {
      lethalHitCount = successfulHits * (1/6); // 6s are lethal hits
      successfulHits -= lethalHitCount; // Remove lethal hits from normal wound process
    }

    // Calculate normal wounds
    normalWounds = successfulHits * woundProb;

    // Process devastating wounds
    if (devastatingWounds) {
      devastatingWoundCount = successfulHits * woundProb * (1/6); // 6s bypass saves
      normalWounds -= devastatingWoundCount; // Remove devastating wounds from normal save process
    }

    // Calculate final wounds after saves
    const normalWoundsAfterSaves = normalWounds * (1 - saveProb);
    
    // Sum up all wounds
    finalResult = 
      normalWoundsAfterSaves + 
      devastatingWoundCount + 
      (lethalHitCount * (1 - saveProb));

    setResult(finalResult);
  }, [
    attacks, 
    hit, 
    wound, 
    savingThrow, 
    rerollHitsOfOne,
    rerollAllHits,
    rerollWoundsOfOne,
    rerollAllWounds,
    devastatingWounds, 
    lethalHits, 
    sustainedHits,
    improvedAP
  ]);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Wound Probability Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Attacks', value: attacks, setter: setAttacks },
              { label: 'Hitting On', value: hit, setter: setHit },
              { label: 'Wounding On', value: wound, setter: setWound },
              { label: 'Saving On', value: savingThrow, setter: setSavingThrow },
            ].map((field) => (
              <div key={field.label} className="flex items-center space-x-2">
                <span className="w-24">{field.label}:</span>
                <Button
                  onClick={() => updateValue(field.setter, field.value - 1)}
                  disabled={field.value <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) => updateValue(field.setter, parseInt(e.target.value))}
                  className="w-16 text-center"
                  min={1}
                  max={6}
                />
                <Button
                  onClick={() => updateValue(field.setter, field.value + 1)}
                  disabled={field.value >= 6}
                >
                  +
                </Button>
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium mb-4">Hit Modifiers</h3>
              <ModifierSwitch 
                label="Reroll Failed Hits" 
                checked={rerollAllHits} 
                onCheckedChange={(checked) => {
                  setRerollAllHits(checked);
                  if (checked) setRerollHitsOfOne(false);
                }}
              />
              <ModifierSwitch 
                label="Reroll Hit Rolls of 1" 
                checked={rerollHitsOfOne} 
                onCheckedChange={(checked) => {
                  setRerollHitsOfOne(checked);
                  if (checked) setRerollAllHits(false);
                }}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium mb-4">Wound Modifiers</h3>
              <ModifierSwitch 
                label="Reroll Failed Wounds" 
                checked={rerollAllWounds} 
                onCheckedChange={(checked) => {
                  setRerollAllWounds(checked);
                  if (checked) setRerollWoundsOfOne(false);
                }}
              />
              <ModifierSwitch 
                label="Reroll Wound Rolls of 1" 
                checked={rerollWoundsOfOne} 
                onCheckedChange={(checked) => {
                  setRerollWoundsOfOne(checked);
                  if (checked) setRerollAllWounds(false);
                }}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium mb-4">Critical Effects</h3>
              <ModifierSwitch 
                label="Devastating Wounds" 
                description="Wound rolls of 6 bypass saves"
                checked={devastatingWounds} 
                onCheckedChange={setDevastatingWounds}
              />
              <ModifierSwitch 
                label="Lethal Hits" 
                description="Hit rolls of 6 auto-wound"
                checked={lethalHits} 
                onCheckedChange={setLethalHits}
              />
              <ModifierSwitch 
                label="Sustained Hits 1" 
                description="Hit rolls of 6 score +1 hit"
                checked={sustainedHits} 
                onCheckedChange={setSustainedHits}
              />
               <ModifierSwitch 
                label="Improve AP by 1" 
                description="Wound rolls of 6 improve AP by 1"
                checked={improvedAP} 
                onCheckedChange={setImprovedAP}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <strong>Expected Wounds:</strong>
              <span className="text-lg">{result.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// TODO
// preysight mode - show all the individual calculations
// add damage card for damage and FNP, outputs damage estimate rounding down damage per wound
// sustained hits 2 and 3
// attack and saving on modifiers need to be uncapped from 6