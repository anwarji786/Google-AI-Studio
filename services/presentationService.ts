import type { Slide, ParsedXlsxData } from '../types';
import { loadScript } from './scriptLoader';

const JSZIP_CDN = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
const PPTXGEN_CDN = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.min.js";

const addChartsToSlide = (pres: any, slide: any, chartData: any) => {
    if (!chartData || !chartData.data) {
        return;
    }

    // PptxGenJS requires specific data formats
    const pptxChartData = chartData.data.map((series: any) => ({
        name: series.name,
        labels: series.labels,
        values: series.values,
    }));

    const chartOptions: any = {
        x: 0.5,
        y: 2.0,
        w: 9.0,
        h: 5.0,
        title: chartData.title,
        showTitle: true,
        titleFontSize: 18,
        showLegend: true,
        legendPos: 'b',
        barDir: 'col',
        catAxisLabelColor: 'F1F1F1',
        valAxisLabelColor: 'F1F1F1',
        valAxisLineColor: '666666',
        catAxisLineColor: '666666',
        dataLabelColor: 'F1F1F1',
        color: ['00A6A6', '61C3D9', '212F45', 'F0A202', 'D95D39'], // Custom color palette
    };

    let chartType;
    switch (chartData.type) {
        case 'bar':
            chartType = pres.ChartType.bar;
            break;
        case 'pie':
            chartType = pres.ChartType.pie;
            chartOptions.showPercent = true;
            break;
        case 'line':
            chartType = pres.ChartType.line;
            break;
        default:
            chartType = pres.ChartType.bar;
    }

    slide.addChart(chartType, pptxChartData, chartOptions);
};

export const createPresentation = async (slides: Slide[], xlsxData: ParsedXlsxData): Promise<Blob> => {
    // PptxGenJS has a dependency on JSZip, so we need to load it first.
    await loadScript(JSZIP_CDN, 'JSZip');
    const PptxGenJS = await loadScript(PPTXGEN_CDN, 'PptxGenJS');
    
    const pres = new PptxGenJS();

    pres.layout = 'LAYOUT_16x9';

    // Master slide styles
    pres.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: '1A202C' },
        objects: [
            { 'rect': { x: 0, y: 6.9, w: '100%', h: 0.6, fill: { color: '00A6A6' } } },
            { 'text': {
                text: 'AI Generated Presentation',
                options: { x: 0, y: 6.9, w: '100%', h: 0.6, align: 'center', color: 'FFFFFF', fontSize: 14 }
            }}
        ],
    });

    slides.forEach((slideData, index) => {
        const slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });

        slide.addText(slideData.title, {
            x: 0.5,
            y: 0.25,
            w: '90%',
            h: 1.0,
            fontSize: index === 0 ? 44 : 32,
            bold: true,
            color: '00A6A6',
            align: index === 0 ? 'center' : 'left',
            valign: index === 0 ? 'middle' : 'top',
        });
        
        if (slideData.speakerNotes) {
            slide.addNotes(slideData.speakerNotes);
        }

        // Handle different slide layouts
        if (slideData.chart) {
            addChartsToSlide(pres, slide, slideData.chart);
        } else {
            // Full-width text layout
            slide.addText(slideData.content.map(pt => ({ text: pt, options: { bullet: true } })), {
                x: 0.5, y: 1.5, w: '90%', h: '70%', color: 'F1F1F1', fontSize: 18,
            });
        }
    });

    const blob = await pres.write({ outputType: "blob" });
    return blob as Blob;
};