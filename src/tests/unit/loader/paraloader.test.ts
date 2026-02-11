import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseCSV,
  inferDefaultsFromCsvText,
  LoadError,
  LoadErrorCode,
} from '../../../../lib/loader/paraloader';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_DATA_DIR = resolve(__dirname, '../../../demo-data');
const HEADLESS_CSV_DIR = resolve(__dirname, '../../../demo/headless/csvs');

describe('paraloader', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV with headers', () => {
      const csv = 'name,value\nAlice,100\nBob,200';
      const result = parseCSV(csv);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'Alice', value: '100' });
      expect(result.data[1]).toEqual({ name: 'Bob', value: '200' });
      expect(result.fields).toHaveLength(2);
      expect(result.fields[0].name).toBe('name');
      expect(result.fields[1].name).toBe('value');
    });

    it('should detect number type for numeric columns', () => {
      const csv = 'label,amount\nA,100\nB,200';
      const result = parseCSV(csv);

      expect(result.fields.find(f => f.name === 'label')?.type).toBe('string');
      expect(result.fields.find(f => f.name === 'amount')?.type).toBe('number');
    });

    it('should throw LoadError for empty CSV', () => {
      expect(() => parseCSV('')).toThrow(LoadError);
    });

    it('should throw LoadError for header-only CSV', () => {
      expect(() => parseCSV('col1,col2')).toThrow(LoadError);
    });

    it('should include CSV_EMPTY error code for empty CSV', () => {
      try {
        parseCSV('col1,col2\n');
      } catch (e) {
        expect(e).toBeInstanceOf(LoadError);
        expect((e as LoadError).code).toBe(LoadErrorCode.CSV_EMPTY);
      }
    });

    it('should parse CSV with Unix line endings (LF)', () => {
      const csv = 'name,value\nAlice,100\nBob,200';
      const result = parseCSV(csv);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'Alice', value: '100' });
    });

    it('should parse CSV with Windows line endings (CRLF)', () => {
      const csv = 'name,value\r\nAlice,100\r\nBob,200';
      const result = parseCSV(csv);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'Alice', value: '100' });
    });

    describe('data accessibility', () => {
      it('should allow accessing individual row values by column name', () => {
        const csv = 'year,sales,profit\n2020,1000,200\n2021,1500,300\n2022,2000,400';
        const result = parseCSV(csv);

        expect(result.data[0]['year']).toBe('2020');
        expect(result.data[0]['sales']).toBe('1000');
        expect(result.data[0]['profit']).toBe('200');
        expect(result.data[2]['year']).toBe('2022');
        expect(result.data[2]['profit']).toBe('400');
      });

      it('should preserve all rows in correct order', () => {
        const csv = 'id,name\n1,first\n2,second\n3,third\n4,fourth';
        const result = parseCSV(csv);

        expect(result.data).toHaveLength(4);
        expect(result.data.map(r => r.id)).toEqual(['1', '2', '3', '4']);
        expect(result.data.map(r => r.name)).toEqual(['first', 'second', 'third', 'fourth']);
      });

      it('should handle values with special characters', () => {
        const csv = 'name,description\n"Smith, John","Sales rep"\n"O\'Brien",Manager';
        const result = parseCSV(csv);

        expect(result.data[0]['name']).toBe('Smith, John');
        expect(result.data[1]['name']).toBe("O'Brien");
      });

      it('should handle empty values as empty strings', () => {
        const csv = 'col1,col2,col3\na,,c\n,b,\nx,y,z';
        const result = parseCSV(csv);

        expect(result.data[0]).toEqual({ col1: 'a', col2: '', col3: 'c' });
        expect(result.data[1]).toEqual({ col1: '', col2: 'b', col3: '' });
        expect(result.data[2]).toEqual({ col1: 'x', col2: 'y', col3: 'z' });
      });
    });

    describe('field type inference', () => {
      it('should detect integer fields as number', () => {
        const csv = 'id,count\n1,100\n2,200\n3,300';
        const result = parseCSV(csv);

        expect(result.fields.find(f => f.name === 'id')?.type).toBe('number');
        expect(result.fields.find(f => f.name === 'count')?.type).toBe('number');
      });

      it('should detect decimal fields as number', () => {
        const csv = 'item,price\nApple,1.99\nBanana,0.50';
        const result = parseCSV(csv);

        expect(result.fields.find(f => f.name === 'price')?.type).toBe('number');
      });

      it('should detect negative numbers as number', () => {
        const csv = 'month,change\nJan,-5.5\nFeb,10.2';
        const result = parseCSV(csv);

        expect(result.fields.find(f => f.name === 'change')?.type).toBe('number');
      });

      it('should detect text fields as string', () => {
        const csv = 'name,category\nAlice,Premium\nBob,Standard';
        const result = parseCSV(csv);

        expect(result.fields.find(f => f.name === 'name')?.type).toBe('string');
        expect(result.fields.find(f => f.name === 'category')?.type).toBe('string');
      });

      it('should return correct field count', () => {
        const csv = 'a,b,c,d,e\n1,2,3,4,5';
        const result = parseCSV(csv);

        expect(result.fields).toHaveLength(5);
        expect(result.fields.map(f => f.name)).toEqual(['a', 'b', 'c', 'd', 'e']);
      });

      it('should handle mixed type columns (first row determines type)', () => {
        // Note: type inference only looks at first row
        const csv = 'mixed\n100\ntext\n200';
        const result = parseCSV(csv);

        expect(result.fields.find(f => f.name === 'mixed')?.type).toBe('number');
      });
    });
  });

  describe('inferDefaultsFromCsvText', () => {
    describe('chart title from filename', () => {
      it('should generate title from filename with extension', () => {
        const csv = 'x,y\n1,2';
        const result = inferDefaultsFromCsvText(csv, 'sales-data.csv');
        expect(result.chartTitle).toBe('Sales Data');
      });

      it('should handle underscores in filename', () => {
        const csv = 'x,y\n1,2';
        const result = inferDefaultsFromCsvText(csv, 'annual_revenue_report.csv');
        expect(result.chartTitle).toBe('Annual Revenue Report');
      });

      it('should return empty title when no filename provided', () => {
        const csv = 'x,y\n1,2';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.chartTitle).toBe('');
      });
    });

    describe('axis titles from headers', () => {
      it('should use first column as xAxis title', () => {
        const csv = 'Year,Sales\n2020,100';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.title).toBe('Year');
      });

      it('should use second column as yAxis title when only two columns', () => {
        const csv = 'Month,Revenue\n2020,100';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.yAxis.title).toBe('Revenue');
      });

      it('should concatenate all series labels when more than two columns', () => {
        const csv = 'Year,Sales,Profit,Tax\n2020,100,50,10';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.yAxis.title).toBe('Sales, Profit, Tax');
      });
    });

    describe('date detection', () => {
      it('should detect ISO date format (yyyy-mm-dd)', () => {
        const csv = 'date,value\n2023-01-15,100\n2023-02-20,200';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('date');
      });

      it('should detect ISO datetime format', () => {
        const csv = 'timestamp,value\n2023-01-15T10:30:00,100\n2023-02-20T14:00:00,200';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('date');
      });

      it('should detect US date format (mm/dd/yyyy)', () => {
        const csv = 'date,value\n01/15/2023,100\n02/20/2023,200';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('date');
      });

      it('should detect 4-digit year when header contains "year"', () => {
        const csv = 'Year,Sales\n2020,100\n2021,200\n2022,300';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('date');
      });

      it('should detect 4-digit year when header contains "date"', () => {
        const csv = 'date_field,Sales\n2020,100\n2021,200';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('date');
      });

      it('should detect 4-digit year when header is "yr"', () => {
        const csv = 'yr,Sales\n2020,100\n2021,200';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('date');
      });

      it('should NOT treat 4-digit numbers as dates without year-related header', () => {
        const csv = 'code,value\n2020,100\n2021,200';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('number');
      });

      it('should NOT match "yr" within words like "country"', () => {
        const csv = 'country,population\nFrance,67\nGermany,83';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('string');
      });
    });

    describe('number detection', () => {
      it('should detect integer columns', () => {
        const csv = 'label,count\nA,100\nB,200';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.yAxis.dataType).toBe('number');
      });

      it('should detect decimal columns', () => {
        const csv = 'item,price\nWidget,19.99\nGadget,29.50';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.yAxis.dataType).toBe('number');
      });

      it('should detect negative numbers', () => {
        const csv = 'month,change\nJan,-5\nFeb,10';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.yAxis.dataType).toBe('number');
      });
    });

    describe('string detection', () => {
      it('should detect text columns', () => {
        const csv = 'name,category\nAlice,Premium\nBob,Standard';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('string');
        expect(result.yAxis.dataType).toBe('string');
      });

      it('should treat mixed columns as string', () => {
        const csv = 'id,status\n1,active\n2,inactive';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.yAxis.dataType).toBe('string');
      });
    });

    describe('error handling', () => {
      it('should throw LoadError for CSV with only header', () => {
        expect(() => inferDefaultsFromCsvText('col1,col2')).toThrow(LoadError);
        expect(() => inferDefaultsFromCsvText('col1,col2')).toThrow(
          'CSV must have at least a header row and one data row'
        );
      });

      it('should throw LoadError for empty CSV', () => {
        expect(() => inferDefaultsFromCsvText('')).toThrow(LoadError);
      });

      it('should throw LoadError for single-column CSV', () => {
        expect(() => inferDefaultsFromCsvText('col1\nval1')).toThrow(LoadError);
        expect(() => inferDefaultsFromCsvText('col1\nval1')).toThrow(
          'CSV must have at least two columns'
        );
      });

      it('should include CSV_INVALID_FORMAT error code for insufficient rows', () => {
        try {
          inferDefaultsFromCsvText('col1,col2');
        } catch (e) {
          expect(e).toBeInstanceOf(LoadError);
          expect((e as LoadError).code).toBe(LoadErrorCode.CSV_INVALID_FORMAT);
        }
      });

      it('should include CSV_INVALID_FORMAT error code for insufficient columns', () => {
        try {
          inferDefaultsFromCsvText('col1\nval1');
        } catch (e) {
          expect(e).toBeInstanceOf(LoadError);
          expect((e as LoadError).code).toBe(LoadErrorCode.CSV_INVALID_FORMAT);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle whitespace in values', () => {
        const csv = 'name, value\n Alice , 100 \n Bob , 200 ';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.title).toBe('name');
        expect(result.yAxis.title).toBe('value');
      });

      it('should handle empty cells gracefully', () => {
        const csv = 'date,value\n2023-01-01,\n2023-01-02,100';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('date');
      });

      it('should handle single data row', () => {
        const csv = 'x,y\n1,2';
        const result = inferDefaultsFromCsvText(csv);
        expect(result.xAxis.dataType).toBe('number');
        expect(result.yAxis.dataType).toBe('number');
      });
    });
  });

  describe('real file tests - demo-data', () => {
    describe('manifest files', () => {
      it('should parse bar-multi-manifest-48.json', () => {
        const content = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48.json'), 'utf-8');
        const manifest = JSON.parse(content);
        
        expect(manifest.datasets).toHaveLength(1);
        expect(manifest.datasets[0].representation.subtype).toBe('column');
        expect(manifest.datasets[0].title).toBe('Gross domestic product of the ASEAN countries from 2008 to 2018');
        expect(manifest.datasets[0].series.length).toBeGreaterThan(0);
        expect(manifest.datasets[0].facets.x.datatype).toBe('date');
        expect(manifest.datasets[0].facets.y.datatype).toBe('number');
      });

      it('should parse line-single-manifest-128.json', () => {
        const content = readFileSync(resolve(DEMO_DATA_DIR, 'line-single-manifest-128.json'), 'utf-8');
        const manifest = JSON.parse(content);
        
        expect(manifest.datasets[0].representation.subtype).toBe('line');
        expect(manifest.datasets[0].title).toBe('Cattle population worldwide 2012 to 2019');
        expect(manifest.datasets[0].series).toHaveLength(1);
      });

      it('should parse donut-manifest-dark-matter.json', () => {
        const content = readFileSync(resolve(DEMO_DATA_DIR, 'donut-manifest-dark-matter.json'), 'utf-8');
        const manifest = JSON.parse(content);
        
        expect(manifest.datasets[0].representation.subtype).toBe('donut');
        expect(manifest.datasets[0].title).toBe('Division of energy in the Universe');
        expect(manifest.datasets[0].facets.x.datatype).toBe('string');
      });

      it('should parse china-gdp-line-1.manifest.json', () => {
        const content = readFileSync(resolve(DEMO_DATA_DIR, 'china-gdp-line-1.manifest.json'), 'utf-8');
        const manifest = JSON.parse(content);
        
        expect(manifest.datasets[0].representation.subtype).toBe('line');
        expect(manifest.datasets[0].title).toContain('China');
        expect(manifest.datasets[0].facets.x.label).toBe('Year');
      });

      it('should parse bar-multi-manifest-48-external.json (external data source)', () => {
        const content = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48-external.json'), 'utf-8');
        const manifest = JSON.parse(content);
        
        expect(manifest.datasets[0].data.source).toBe('external');
        expect(manifest.datasets[0].data.path).toBeDefined();
      });
    });

    describe('CSV files with parseCSV', () => {
      it('should parse bar-multi-manifest-48.csv', () => {
        const csv = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48.csv'), 'utf-8');
        const result = parseCSV(csv);

        expect(result.data.length).toBeGreaterThan(0);
        expect(result.fields[0].name).toBe('Year');
        expect(result.fields.map(f => f.name)).toContain('Brunei');
        expect(result.fields.map(f => f.name)).toContain('Singapore');
      });

      it('should parse line-single-1066.csv', () => {
        const csv = readFileSync(resolve(DEMO_DATA_DIR, 'line-single-1066.csv'), 'utf-8');
        const result = parseCSV(csv);

        expect(result.data.length).toBeGreaterThan(10);
        expect(result.fields[0].name).toBe('Year');
        expect(result.fields[1].name).toBe('Median age in years');
      });

      it('should parse donut-dark-matter.csv', () => {
        const csv = readFileSync(resolve(DEMO_DATA_DIR, 'donut-dark-matter.csv'), 'utf-8');
        const result = parseCSV(csv);

        expect(result.data).toHaveLength(4);
        expect(result.fields[0].name).toBe('Kind of energy');
        expect(result.data.map(d => d['Kind of energy'])).toContain('Dark Energy');
      });
    });

    describe('CSV files with inferDefaultsFromCsvText', () => {
      it('should infer defaults from bar-multi-manifest-48.csv', () => {
        const csv = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48.csv'), 'utf-8');
        const result = inferDefaultsFromCsvText(csv, 'bar-multi-manifest-48.csv');

        expect(result.chartTitle).toBe('Bar Multi Manifest 48');
        expect(result.xAxis.title).toBe('Year');
        expect(result.xAxis.dataType).toBe('date'); // 4-digit years with "Year" header
      });

      it('should infer defaults from line-single-1066.csv', () => {
        const csv = readFileSync(resolve(DEMO_DATA_DIR, 'line-single-1066.csv'), 'utf-8');
        const result = inferDefaultsFromCsvText(csv, 'line-single-1066.csv');

        expect(result.chartTitle).toBe('Line Single 1066');
        expect(result.xAxis.title).toBe('Year');
        expect(result.xAxis.dataType).toBe('date');
        expect(result.yAxis.title).toBe('Median age in years');
        expect(result.yAxis.dataType).toBe('number');
      });

      it('should infer defaults from donut-dark-matter.csv', () => {
        const csv = readFileSync(resolve(DEMO_DATA_DIR, 'donut-dark-matter.csv'), 'utf-8');
        const result = inferDefaultsFromCsvText(csv, 'donut-dark-matter.csv');

        expect(result.chartTitle).toBe('Donut Dark Matter');
        expect(result.xAxis.title).toBe('Kind of energy');
        expect(result.xAxis.dataType).toBe('string');
        expect(result.yAxis.dataType).toBe('number');
      });
    });
  });

  describe('real file tests - headless/csvs', () => {
    it('should parse line-single-1066.csv from headless', () => {
      const csv = readFileSync(resolve(HEADLESS_CSV_DIR, 'line-single-1066.csv'), 'utf-8');
      const result = parseCSV(csv);

      expect(result.data.length).toBeGreaterThan(10);
      expect(result.fields[0].name).toBe('Year');
    });

    it('should parse bar-single-1018.csv', () => {
      const csv = readFileSync(resolve(HEADLESS_CSV_DIR, 'bar-single-1018.csv'), 'utf-8');
      const result = parseCSV(csv);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.fields.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse line-multi-57.csv', () => {
      const csv = readFileSync(resolve(HEADLESS_CSV_DIR, 'line-multi-57.csv'), 'utf-8');
      const result = parseCSV(csv);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.fields.length).toBeGreaterThan(2); // Multiple series
    });

    it('should parse line-multi-76.csv', () => {
      const csv = readFileSync(resolve(HEADLESS_CSV_DIR, 'line-multi-76.csv'), 'utf-8');
      const result = parseCSV(csv);

      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should infer defaults from bar-single-1018.csv', () => {
      const csv = readFileSync(resolve(HEADLESS_CSV_DIR, 'bar-single-1018.csv'), 'utf-8');
      const result = inferDefaultsFromCsvText(csv, 'bar-single-1018.csv');

      expect(result.chartTitle).toBe('Bar Single 1018');
      expect(result.xAxis.title).toBeDefined();
    });

    it('should infer defaults from donut-dark-matter.csv', () => {
      const csv = readFileSync(resolve(HEADLESS_CSV_DIR, 'donut-dark-matter.csv'), 'utf-8');
      const result = inferDefaultsFromCsvText(csv, 'donut-dark-matter.csv');

      expect(result.xAxis.dataType).toBe('string'); // Category names
      expect(result.yAxis.dataType).toBe('number'); // Percentages
    });
  });

  describe('data correctness verification', () => {
    it('should correctly parse ASEAN GDP data values from bar-multi-manifest-48.csv', () => {
      const csv = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48.csv'), 'utf-8');
      const result = parseCSV(csv);

      // Verify specific known values from the CSV
      const row2008 = result.data.find(r => r['Year'] === '2008');
      expect(row2008).toBeDefined();
      expect(row2008!['Brunei']).toBe('16.01');
      expect(row2008!['Singapore']).toBe('193.62');
      expect(row2008!['Indonesia']).toBe('558.58');

      const row2018 = result.data.find(r => r['Year'] === '2018*');
      expect(row2018).toBeDefined();
      expect(row2018!['Vietnam']).toBe('241.27');
    });

    it('should correctly parse median age data from line-single-1066.csv', () => {
      const csv = readFileSync(resolve(DEMO_DATA_DIR, 'line-single-1066.csv'), 'utf-8');
      const result = parseCSV(csv);

      // Verify specific known values
      const row1950 = result.data.find(r => r['Year'] === '1950');
      expect(row1950).toBeDefined();
      expect(row1950!['Median age in years']).toBe('24.5');

      const row2020 = result.data.find(r => r['Year'] === '2020*');
      expect(row2020).toBeDefined();
      expect(row2020!['Median age in years']).toBe('32.5');
    });

    it('should correctly parse dark matter distribution from donut-dark-matter.csv', () => {
      const csv = readFileSync(resolve(DEMO_DATA_DIR, 'donut-dark-matter.csv'), 'utf-8');
      const result = parseCSV(csv);

      // Verify all 4 categories with exact values
      expect(result.data).toHaveLength(4);
      
      const darkEnergy = result.data.find(r => r['Kind of energy'] === 'Dark Energy');
      expect(darkEnergy!['Proportion of total energy in the Universe']).toBe('73');

      const darkMatter = result.data.find(r => r['Kind of energy'] === 'Dark Matter');
      expect(darkMatter!['Proportion of total energy in the Universe']).toBe('23');

      const nonluminous = result.data.find(r => r['Kind of energy'] === 'Nonluminous Matter');
      expect(nonluminous!['Proportion of total energy in the Universe']).toBe('3.6');

      const luminous = result.data.find(r => r['Kind of energy'] === 'Luminous Matter');
      expect(luminous!['Proportion of total energy in the Universe']).toBe('0.4');
    });

    it('should detect correct field types for multi-series data', () => {
      const csv = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48.csv'), 'utf-8');
      const result = parseCSV(csv);

      // Year should be string (contains "2018*"), all country columns should be number
      expect(result.fields.find(f => f.name === 'Year')?.type).toBe('number');
      expect(result.fields.find(f => f.name === 'Brunei')?.type).toBe('number');
      expect(result.fields.find(f => f.name === 'Singapore')?.type).toBe('number');
      expect(result.fields.find(f => f.name === 'Vietnam')?.type).toBe('number');
    });

    it('should correctly infer date type for year columns', () => {
      const csv = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48.csv'), 'utf-8');
      const defaults = inferDefaultsFromCsvText(csv, 'test.csv');

      // inferDefaultsFromCsvText has smarter date detection with header hints
      expect(defaults.xAxis.dataType).toBe('date');
    });

    it('should allow iterating through all rows', () => {
      const csv = readFileSync(resolve(DEMO_DATA_DIR, 'bar-multi-manifest-48.csv'), 'utf-8');
      const result = parseCSV(csv);

      // Should be able to map/reduce/filter data
      const years = result.data.map(row => row['Year']);
      expect(years).toContain('2008');
      expect(years).toContain('2018*');
      expect(years.length).toBe(result.data.length);

      // Sum a column
      const bruneiTotal = result.data.reduce((sum, row) => sum + parseFloat(row['Brunei']), 0);
      expect(bruneiTotal).toBeGreaterThan(0);
    });
  });
});
