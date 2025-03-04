import React, { FC, useEffect, useRef, useState } from 'react';
import { PanelCanvasElement } from '../PanelCanvas';
import { LocalShim } from '../../shims/LocalShim';
import { ProjectInstrumentsHandler } from '../../Project/fs/Instruments';
import { useProject } from '../../hooks/ProjectContext';
import { InstrumentFrame } from '../../../shared/types/project/canvas/InstrumentFrame';

export interface InstrumentFile {
    name: string,
    path: string,
    contents: string,
}

export interface Instrument {
    files: InstrumentFile[],
    config: InstrumentConfig,
}

export interface InstrumentConfig {
    index: string,
    isInteractive: boolean,
    name: string,
    dimensions: InstrumentDimensions,
}

export interface InstrumentDimensions {
    width: number,
    height: number,
}

export interface InstrumentFrameElementProps {
    instrumentFrame: InstrumentFrame,
    zoom: number,
    onDelete: () => void,
}

export const InstrumentFrameElement: FC<InstrumentFrameElementProps> = ({ instrumentFrame, zoom, onDelete }) => {
    const { project } = useProject();

    const [loadedInstrument] = useState(() => ProjectInstrumentsHandler.loadInstrumentByName(project, instrumentFrame.instrumentName));

    const iframeRef = useRef<HTMLIFrameElement>();
    const lastUpdate = useRef(Date.now());

    useEffect(() => {
        if (iframeRef.current && loadedInstrument.config.name) {
            const iframeWindow = iframeRef.current.contentWindow;
            const iframeDocument = iframeRef.current.contentDocument;

            iframeDocument.body.style.overflow = 'hidden';

            Object.assign(iframeRef.current.contentWindow, new LocalShim());

            const rootTag = iframeDocument.createElement('div');
            rootTag.id = 'ROOT_ELEMENT';

            const mountTag = iframeDocument.createElement('div');
            mountTag.id = 'MSFS_REACT_MOUNT';

            rootTag.append(mountTag);

            const pfdTag = iframeDocument.createElement('a35-x-ecam');
            pfdTag.setAttribute('url', 'a?Index=1');

            const scriptTag = iframeDocument.createElement('script');
            scriptTag.text = loadedInstrument.files[1].contents;

            const styleTag = iframeDocument.createElement('style');
            styleTag.textContent = loadedInstrument.files[0].contents;

            // Clear all intervals in the iframe
            const lastInterval = iframeWindow.setInterval(() => {
            }, 99999999);
            for (let i = 0; i < lastInterval; i++) {
                iframeWindow.clearInterval(i);
            }

            const lastTimeout = iframeWindow.setTimeout(() => {
            }, 99999999);
            for (let i = 0; i < lastTimeout; i++) {
                iframeWindow.clearTimeout(i);
            }

            iframeDocument.head.innerHTML = '<base href="http://localhost:39511" />';
            iframeDocument.body.innerHTML = '';
            iframeDocument.body.style.margin = '0';

            iframeDocument.body.append(rootTag);
            iframeDocument.body.append(pfdTag);
            iframeDocument.head.append(styleTag);
            iframeDocument.head.append(scriptTag);

            setInterval(() => {
                const newUpdate = Date.now();
                iframeDocument.getElementById('ROOT_ELEMENT').dispatchEvent(new CustomEvent('update', { detail: newUpdate - lastUpdate.current }));
                lastUpdate.current = newUpdate;
            }, 50);
        }
    }, [iframeRef, loadedInstrument?.config.name, loadedInstrument.files]);

    return (
        <PanelCanvasElement title={loadedInstrument.config.name} canvasZoom={zoom} onDelete={onDelete}>
            <iframe
                title="Instrument Frame"
                ref={iframeRef}
                width={loadedInstrument.config.dimensions.width}
                height={loadedInstrument.config.dimensions.height}
            />
        </PanelCanvasElement>
    );
};
