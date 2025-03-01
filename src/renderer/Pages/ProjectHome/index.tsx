import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useProject } from '../../hooks/ProjectContext';
import { ProjectCanvasSaveHandler } from '../../Project/fs/Canvas';
import { CanvasElementFactory } from '../../Project/canvas/ElementFactory';
import { PossibleCanvasElements } from '../../../shared/types/project/canvas/CanvasSaveFile';
import { InteractionToolbar } from './InteractionToolbar';
import { PanelCanvas } from '../PanelCanvas';
import { InstrumentFrameElement } from '../Canvas/InstrumentFrameElement';

type WorkspaceType = {
    addInstrument: (instrument: string) => void;
}

export const WorkspaceContext = createContext<WorkspaceType>(undefined as any);
export const useWorkspace = () => useContext(WorkspaceContext);

export const Project = () => {
    const { project } = useProject();

    const doLoadProjectCanvasSave = useCallback(() => {
        const canvasSave = ProjectCanvasSaveHandler.loadCanvas(project);

        setCanvasElements(canvasSave.elements);
    }, [project]);

    const [canvasElements, setCanvasElements] = useState<PossibleCanvasElements[]>([]);

    useEffect(() => {
        if (project) {
            doLoadProjectCanvasSave();
        }
    }, [project]);


    const handleAddInstrument = (instrument: string) => {
        const newInstrumentPanel = CanvasElementFactory.newInstrumentPanel({
            title: instrument,
            instrumentName: instrument,
            position: {
                x: 0,
                y: 0,
            },
        });

        setCanvasElements((old) => [...old, newInstrumentPanel]);
        ProjectCanvasSaveHandler.addElement(project, newInstrumentPanel);
    }

    const handleDeleteCanvasElement = (element: PossibleCanvasElements) => {
        setCanvasElements((old) => old.filter((el) => el.__uuid !== element.__uuid));

        ProjectCanvasSaveHandler.removeElement(project, element);
    };
    

    return (
        <WorkspaceContext.Provider value={{ addInstrument: handleAddInstrument }}>
            <div className="w-full h-full flex">
                <div className="absolute z-50 p-7">
                    <InteractionToolbar />
                </div>

                <div className="relative w-full h-full z-40">
                    <PanelCanvas render={(zoom) => (
                        <>
                            {canvasElements.map((canvasElement) => {
                                if (canvasElement.__kind === 'instrument') {
                                    return (
                                        <InstrumentFrameElement
                                            key={canvasElement.title}
                                            instrumentFrame={canvasElement}
                                            zoom={zoom}
                                            onDelete={() => handleDeleteCanvasElement(canvasElement)}
                                        />
                                    );
                                }
                                return null;
                            })}
                        </>
                    )}
                    />
                </div>            
            </div>
        </WorkspaceContext.Provider>
    );  
};
