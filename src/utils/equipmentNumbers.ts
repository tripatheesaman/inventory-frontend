export function expandEquipmentNumbers(equipmentNumber: string): Set<string> {
  const numbers = new Set<string>();
  const parts = equipmentNumber.split(',');

  for (const part of parts) {
    const trimmedPart = part.trim();
    // If it's purely alphabets & spaces
    if (/^[A-Za-z\s]+$/.test(trimmedPart)) {
      numbers.add(trimmedPart);
    }
    // If it's a number range (e.g., "1000-1024")
    else if (/^\d+-\d+$/.test(trimmedPart)) {
      const [start, end] = trimmedPart.split('-').map(Number);
      for (let num = start; num <= end; num++) {
        numbers.add(num.toString());
      }
    }
    // If it's a single number (e.g., "1000")
    else if (/^\d+$/.test(trimmedPart)) {
      numbers.add(trimmedPart);
    }
  }

  return numbers;
}

export function normalizeEquipmentNumbers(equipmentNumbers: string): string {
  let normalized = String(equipmentNumbers);
  normalized = normalized.replace(/\b(ge|GE)\b/g, '');

  // Split the equipment numbers by commas
  const items = normalized.split(',').map(item => item.trim());

  // Separate numbers and string-based descriptions
  const numbers: number[] = [];
  const descriptions = new Set<string>();

  for (const item of items) {
    // Check if it's a number or a description
    if (/^\d+$/.test(item)) {
      numbers.push(parseInt(item, 10));
    } else {
      const cleanedItem = item.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      if (cleanedItem) {
        descriptions.add(cleanedItem.toLowerCase());
      }
    }
  }

  // Process numbers to create ranges if possible
  numbers.sort((a, b) => a - b);
  const rangeNumbers: string[] = [];
  let tempRange: string[] = [];

  for (let i = 0; i < numbers.length; i++) {
    if (i === 0 || numbers[i] === numbers[i - 1] + 1) {
      tempRange.push(numbers[i].toString());
    } else {
      if (tempRange.length > 1) {
        rangeNumbers.push(`${tempRange[0]}-${tempRange[tempRange.length - 1]}`);
      } else {
        rangeNumbers.push(tempRange[0]);
      }
      tempRange = [numbers[i].toString()];
    }
  }

  if (tempRange.length > 0) {
    if (tempRange.length > 1) {
      rangeNumbers.push(`${tempRange[0]}-${tempRange[tempRange.length - 1]}`);
    } else {
      rangeNumbers.push(tempRange[0]);
    }
  }

  // Convert descriptions to proper case (with spaces restored)
  const properCaseDescriptions = Array.from(descriptions).map(description => 
    description.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );

  // Combine results into a final string without trailing commas
  const resultParts: string[] = [];
  if (rangeNumbers.length > 0) {
    resultParts.push(rangeNumbers.join(', '));
  }
  if (properCaseDescriptions.length > 0) {
    resultParts.push(properCaseDescriptions.sort().join(', '));
  }

  return resultParts.join(', ');
} 