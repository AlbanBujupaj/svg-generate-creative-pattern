import React, { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react"

import { SVG, Svg } from "@svgdotjs/svg.js";
import { createNoise2D } from "simplex-noise";
import { map } from "@georgedoescode/generative-utils";

import debounce from "debounce";
import copy from "copy-to-clipboard";
import "../styles/SVGGenerator.scss";

const CELL_OPTIONS = [10, 20, 25, 40];
const WIDTH = 400;
const HEIGHT = 400;

type Mode = "LINES" | "DOTS" | "SQUARES" | "TRIANGLES";

const SVGGenerator: React.FC = () => {
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const drawRef = useRef<Svg | null>(null);

  const simplex = useMemo(() => createNoise2D(), []);

  const [cellSizeIndex, setCellSizeIndex] = useState<number>(0);
  const [res, setRes] = useState<number>(CELL_OPTIONS[0]);
  const [color, setColor] = useState<string>("#1a1a1a");
  const [mode, setMode] = useState<Mode>("LINES");
  const [noiseInc, setNoiseInc] = useState<number>(0.08);
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [copied, setCopied] = useState<boolean>(false);

  const cols = WIDTH / res;
  const rows = HEIGHT / res;

  useEffect(() => {
    if (canvasRef.current) {
      drawRef.current = SVG(canvasRef.current);
      generate();
    }
  }, []);

  useEffect(() => {
    generate();
  }, [res, color, mode, noiseInc, lineWidth]);

  const generate = () => {
    if (!drawRef.current) return;
    const svg = drawRef.current;
    svg.clear();

    let xOff = Math.random() * 1000;

    for (let i = 0; i < cols; i++) {
      let yOff = 0;
      xOff += noiseInc;

      for (let j = 0; j < rows; j++) {
        const noise = simplex(xOff, yOff);
        const scale = map(noise, -1, 1, 0.125, 0.75);
        const rotate = map(noise, -1, 1, 0, 360);
        const x = i * res;
        const y = j * res;

        switch (mode) {
          case "LINES":
            svg
              .line(x, y, x + res, y + res)
              .scale(0.25)
              .stroke({ color, width: lineWidth, linecap: "round" })
              .rotate(rotate);
            break;

          case "DOTS":
            svg.circle(res).x(x).y(y).fill(color).scale(scale);
            break;

          case "SQUARES":
            svg
              .rect(res, res)
              .x(x)
              .y(y)
              .fill(color)
              .rotate(rotate)
              .scale(scale);
            break;

          case "TRIANGLES":
            svg
              .polygon("0,0 10,20 20,0")
              .fill(color)
              .move(x, y)
              .scale(scale)
              .rotate(rotate);
            break;
        }

        yOff += noiseInc;
      }
    }
  };

  const handleResChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setCellSizeIndex(val);
    setRes(CELL_OPTIONS[val]);
  };

  const handleVarianceChange = debounce(
    (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      const val = parseFloat(input.value);
      setNoiseInc(map(val, 0, 1, 0.025, 0.075));
    },
    10
  );

  const handleColorChange = debounce((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const newColor = input.value;
    setColor(newColor);

    if (drawRef.current) {
      drawRef.current.node.querySelectorAll("*").forEach((el) => {
        if (mode === "DOTS" || mode === "SQUARES" || mode === "TRIANGLES") {
          el.setAttribute("fill", newColor);
        } else {
          el.setAttribute("stroke", newColor);
        }
      });
    }
  }, 10);

  const handleLineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLineWidth(parseFloat(e.target.value));
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value as Mode);
  };

  const handleCopy = () => {
    if (!drawRef.current) return;
    copy(drawRef.current.node.outerHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadSVG = () => {
    if (!drawRef.current) return;

    const svgData = drawRef.current.node.outerHTML;
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "pattern.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="generator">
      <Analytics />
      <svg ref={canvasRef} className="generator__canvas" viewBox="0 0 400 400">
        <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
      </svg>

      <div className="stack generator__controls">
        <div className="generator__control generator__control--switch">
          <label className="generator__control-label" htmlFor="mode">
            Pattern Mode
          </label>
          <select id="mode" value={mode} onChange={handleModeChange}>
            <option value="LINES">Lines</option>
            <option value="DOTS">Dots</option>
            <option value="SQUARES">Squares</option>
            <option value="TRIANGLES">Triangles</option>
          </select>
        </div>

        <div className="generator__control generator__control--range">
          <label className="generator__control-label" htmlFor="cellSizeSlider">
            Cell Size
          </label>
          <input
            className="range-input"
            type="range"
            id="cellSizeSlider"
            min="0"
            max="3"
            step="1"
            value={cellSizeIndex}
            onChange={handleResChange}
          />
        </div>

        <div className="generator__control generator__control--range">
          <label className="generator__control-label" htmlFor="variance">
            Variance
          </label>
          <input
            className="range-input"
            type="range"
            id="variance"
            min="0"
            max="1"
            step="0.1"
            defaultValue="0.5"
            onInput={handleVarianceChange}
          />
        </div>

        {mode === "LINES" && (
          <div className="generator__control generator__control--range">
            <label className="generator__control-label" htmlFor="lineWidth">
              Line Width
            </label>
            <input
              className="range-input"
              type="range"
              id="lineWidth"
              min="0.5"
              max="8"
              step="0.5"
              value={lineWidth}
              onChange={handleLineWidthChange}
            />
          </div>
        )}

        <div className="generator__control generator__control--color">
          <label className="generator__control-label" htmlFor="color">
            Color
          </label>
          <input
            type="color"
            id="color"
            defaultValue={color}
            onInput={handleColorChange}
          />
        </div>

        <div className="generator__buttons">
          <button className="generate" onClick={generate}>
            Regenerate
          </button>
          <button className="clipboard" onClick={handleCopy}>
            {copied ? "Copied to Clipboard!" : "Copy SVG"}
          </button>
          <button className="download" onClick={handleDownloadSVG}>
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
};

export default SVGGenerator;
