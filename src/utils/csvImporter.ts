import { supabase } from '../../supabase';

export interface ImportResult {
  success: boolean;
  type: 'categories' | 'items' | 'unknown';
  count: number;
  message: string;
  errors?: string[];
}

function cleanNum(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  let str = val.toString().replace(/,/g, '').replace(/@/g, '').replace(/\/G/gi, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function formatDate(val: any): string | null {
  if (!val) return null;
  const str = val.toString().trim();
  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return str;
}

// Robust CSV parser supporting quotes, commas, newlines within quotes
export function parseCSVTextRaw(text: string): string[][] {
  const lines: string[] = [];
  let curLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      curLine += c;
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      if (curLine.trim()) lines.push(curLine);
      curLine = '';
    } else {
      curLine += c;
    }
  }
  if (curLine.trim()) lines.push(curLine);

  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        res.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur);
    return res;
  };

  return lines.map(parseLine);
}

export async function importCSVContent(csvText: string): Promise<ImportResult> {
  const rawMatrix = parseCSVTextRaw(csvText);
  if (rawMatrix.length === 0) {
    return {
      success: false,
      type: 'unknown',
      count: 0,
      message: 'The uploaded file is empty or invalid.',
    };
  }

  const header = rawMatrix[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const headerUpper = header.map(h => h.toUpperCase());

  // Check if Vendor CSV format (e.g. MK US.csv with LabelNo, GrossWt, NetWt)
  if (headerUpper.includes('LABELNO') || headerUpper.includes('GROSSWT')) {
    return await importVendorItems(rawMatrix);
  }

  // Standard export format
  if (headerUpper.includes('NAME') && headerUpper.includes('PARENT_ID') && !headerUpper.includes('SKU')) {
    return await importCategoriesStandard(rawMatrix);
  } else {
    return await importItemsStandard(rawMatrix);
  }
}

async function importVendorItems(rawMatrix: string[][]): Promise<ImportResult> {
  const { data: dbCategories } = await supabase.from('categories').select('id, name');
  const categoryMap = new Map<string, string>();
  (dbCategories || []).forEach(c => {
    categoryMap.set(c.name.trim().toUpperCase(), c.id);
  });

  const aliasMap = new Map([
    ['G KUNDAN NECKLACE', 'K NECKLACE'],
    ['G K HAARAM', 'K HAARAM'],
    ['G POLKI TOPS', 'P TOPS'],
    ['G HANGING', 'G HANGINGS'],
    ['G K PENDANT', 'K PENDANT'],
    ['G RING', 'RING'],
    ['G K TOPS', 'K TOPS'],
    ['G POLKI HARAM', 'P HAARAM'],
    ['D NEKLACE', 'SHORT'],
    ['D HANGINGS', 'TOPS'],
    ['D HARAM', 'LONG'],
    ['PLK EARRINGS', 'P TOPS'],
    ['G POLKI NECKLESE', 'P NECKLACE'],
    ['G HAARAM', 'G LONG'],
    ['G TOPS', 'G TOPS'],
    ['G NECKLACE', 'G NEKLACE'],
  ]);

  const itemsToInsert: any[] = [];

  for (let i = 1; i < rawMatrix.length; i++) {
    const row = rawMatrix[i];
    if (row.length < 5) continue;

    const labelNo = row[0] ? row[0].trim() : null;
    const pcs = cleanNum(row[1]) || 1;
    const purity = cleanNum(row[2]);
    const grossWt = cleanNum(row[3]);
    const netWt = cleanNum(row[4]);
    const daiWt = cleanNum(row[5]);
    const daiPcs = cleanNum(row[6]);
    const clrStoneWt = cleanNum(row[7]);
    const clrStonePcs = cleanNum(row[8]);
    const wastage = cleanNum(row[9]);
    const labourAmt = cleanNum(row[10]);
    const labourRate = cleanNum(row[11]);
    const location = row[12] ? row[12].trim() : null;
    const categoryName = row[13] ? row[13].trim() : null;
    const docNo = row[14] ? row[14].trim() : null;
    const docDate = formatDate(row[15]);
    const supplierName = row[16] ? row[16].trim() : null;
    const size = row[17] ? row[17].trim() : null;
    const labelingDate = formatDate(row[18]);
    const purchWastageRate = cleanNum(row[19]);
    const quality = row[20] ? row[20].trim() : null;
    const otherCharges = cleanNum(row[21]);
    const diaPurchaseAmt = cleanNum(row[22]);
    const stonePurchaseAmt = cleanNum(row[23]);
    const huid = row[24] ? row[24].trim() : null;
    const itemName = row[25] ? row[25].trim() : (categoryName || labelNo);

    let categoryId: string | null = null;
    if (categoryName) {
      const upperCat = categoryName.toUpperCase();
      if (categoryMap.has(upperCat)) {
        categoryId = categoryMap.get(upperCat)!;
      } else if (aliasMap.has(upperCat) && categoryMap.has(aliasMap.get(upperCat)!)) {
        categoryId = categoryMap.get(aliasMap.get(upperCat)!)!;
      } else {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({ name: categoryName })
          .select()
          .single();
        if (newCat) {
          categoryId = newCat.id;
          categoryMap.set(upperCat, categoryId);
        }
      }
    }

    itemsToInsert.push({
      name: itemName || 'Unnamed Item',
      sku: labelNo,
      label_no: labelNo,
      category_id: categoryId,
      pcs: pcs,
      quantity: 1,
      unit: 'pcs',
      purity: purity,
      gross_wt: grossWt,
      net_wt: netWt,
      dai_wt: daiWt,
      dai_pcs: daiPcs,
      wastage: wastage,
      labour_amt: labourAmt,
      labour_rate: labourRate,
      location: location,
      doc_no: docNo,
      doc_date: docDate,
      supplier_name: supplierName,
      size: size,
      labeling_date: labelingDate,
      purch_wastage_rate: purchWastageRate,
      quality: quality,
      other_charges: otherCharges,
      dia_purchase_amt: diaPurchaseAmt,
      stone_purchase_amt: stonePurchaseAmt,
      huid: huid,
    });
  }

  const chunkSize = 50;
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
    const chunk = itemsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('items').upsert(chunk, { onConflict: 'sku' });
    if (error) {
      errors.push(`Chunk ${Math.floor(i / chunkSize) + 1}: ${error.message}`);
    } else {
      successCount += chunk.length;
    }
  }

  return {
    success: errors.length === 0,
    type: 'items',
    count: successCount,
    message: `Successfully imported ${successCount} vendor item(s).`,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function importCategoriesStandard(rawMatrix: string[][]): Promise<ImportResult> {
  const header = rawMatrix[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < rawMatrix.length; i++) {
    const vals = rawMatrix[i];
    const obj: any = {};
    header.forEach((h, idx) => {
      let val = vals[idx] !== undefined ? vals[idx].trim() : null;
      if (val === '' || val === undefined) val = null;
      obj[h] = val;
    });
    if (obj.name) rows.push(obj);
  }

  const chunkSize = 50;
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('categories').upsert(chunk, { onConflict: 'id' });
    if (error) errors.push(error.message);
    else successCount += chunk.length;
  }

  return {
    success: errors.length === 0,
    type: 'categories',
    count: successCount,
    message: `Successfully imported ${successCount} category record(s).`,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function importItemsStandard(rawMatrix: string[][]): Promise<ImportResult> {
  const header = rawMatrix[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const numericFields = [
    'min_stock_level', 'purity', 'gross_wt', 'net_wt', 'dai_wt', 'dai_pcs',
    'wastage', 'labour_rate', 'labour_amt',
    'purch_wastage_rate', 'other_charges', 'dia_purchase_amt', 'stone_purchase_amt',
    'cost_price', 'dai_rd', 'dai_pear', 'dai_stb', 'igi_fee', 'prc_amount',
    'weight_with_tag', 'remarked_weight', 'quantity', 'pcs', 'number_of_tags'
  ];
  const jsonFields = ['stones_in_detail', 'image_urls', 'thumbnail_urls'];
  const booleanFields = ['in_exhibition', 'is_remarked'];

  const rows: any[] = [];

  for (let i = 1; i < rawMatrix.length; i++) {
    const vals = rawMatrix[i];
    const item: any = {};
    header.forEach((h, idx) => {
      let val = vals[idx] !== undefined ? vals[idx].trim() : null;
      if (val === '' || val === undefined) {
        item[h] = null;
        return;
      }
      if (val && booleanFields.includes(h)) {
        item[h] = val.toLowerCase() === 'true' || val === '1';
      } else if (val && numericFields.includes(h)) {
        item[h] = cleanNum(val);
      } else if (val && jsonFields.includes(h)) {
        try {
          item[h] = JSON.parse(val);
        } catch {
          item[h] = val;
        }
      } else {
        item[h] = val;
      }
    });

    if (!item.name) item.name = item.sku || 'Unnamed Item';
    if (!item.quantity) item.quantity = 1;
    if (!item.pcs) item.pcs = 1;
    if (!item.unit) item.unit = 'pcs';

    rows.push(item);
  }

  const chunkSize = 50;
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('items').upsert(chunk, { onConflict: 'id' });
    if (error) errors.push(error.message);
    else successCount += chunk.length;
  }

  return {
    success: errors.length === 0,
    type: 'items',
    count: successCount,
    message: `Successfully imported ${successCount} item(s).`,
    errors: errors.length > 0 ? errors : undefined,
  };
}
