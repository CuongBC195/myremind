// Utility function to convert number to Vietnamese currency text
export function numberToVietnameseCurrency(amount: number | string | null | undefined): string {
  if (!amount || amount === "" || amount === null || amount === undefined) {
    return "";
  }

  const num = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
  
  if (isNaN(num) || num < 0) {
    return "";
  }

  if (num === 0) {
    return "Không đồng";
  }

  const ones = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  const hundreds = ["", "một trăm", "hai trăm", "ba trăm", "bốn trăm", "năm trăm", "sáu trăm", "bảy trăm", "tám trăm", "chín trăm"];

  function readGroup(n: number): string {
    if (n === 0) return "";
    
    const result: string[] = [];
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;

    if (hundred > 0) {
      result.push(hundreds[hundred]);
    }

    if (ten > 0) {
      if (ten === 1) {
        if (one === 0) {
          result.push("mười");
        } else if (one === 5) {
          result.push("mười lăm");
        } else {
          result.push(`mười ${ones[one]}`);
        }
      } else {
        if (one === 1) {
          result.push(`${tens[ten]} mốt`);
        } else if (one === 5) {
          result.push(`${tens[ten]} lăm`);
        } else if (one > 0) {
          result.push(`${tens[ten]} ${ones[one]}`);
        } else {
          result.push(tens[ten]);
        }
      }
    } else if (one > 0 && hundred > 0) {
      // Handle case like 101, 102, etc.
      result.push(`lẻ ${ones[one]}`);
    } else if (one > 0) {
      result.push(ones[one]);
    }

    return result.join(" ");
  }

  // Split into groups of 3 digits
  const numStr = Math.floor(num).toString();
  const groups: number[] = [];
  let temp = numStr;
  
  while (temp.length > 0) {
    const group = temp.slice(-3);
    groups.unshift(parseInt(group || "0", 10));
    temp = temp.slice(0, -3);
  }

  const parts: string[] = [];
  const units = ["", "nghìn", "triệu", "tỷ"];
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const unitIndex = groups.length - 1 - i;
    
    if (group > 0) {
      const groupText = readGroup(group);
      if (groupText) {
        parts.push(groupText);
        if (unitIndex > 0 && units[unitIndex]) {
          parts.push(units[unitIndex]);
        }
      }
    } else if (groups.length > 1 && i < groups.length - 1) {
      // Handle zero groups (e.g., 1000000 -> "một triệu" not "một triệu không nghìn")
      // Only add "không" if it's not the last group
      const nextNonZero = groups.slice(i + 1).findIndex(g => g > 0);
      if (nextNonZero === -1 || nextNonZero > 0) {
        // Skip zero groups
      }
    }
  }

  if (parts.length === 0) {
    return "";
  }

  let result = parts.join(" ").trim();
  
  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);
  
  return result + " Việt Nam đồng";
}

