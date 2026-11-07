"use client";

import { ArrowClockwiseIcon, CameraIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onNext: (photo: Blob) => void;
  onBack: () => void;
}

type Phase = "starting" | "live" | "captured" | "unavailable";

/** Step 2: a required profile photo — live camera with retake, or a file picker when the camera can't be used. */
export function CameraCapture({ onNext, onBack }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  // The stream can attach before the video element has a real frame to draw; capturing too early
  // produces a 0×0 (blank) photo that still "succeeds" silently. Only allow it once a frame is ready.
  const [canCapture, setCanCapture] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPhase("live");
      })
      .catch(() => setPhase("unavailable"));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCaptureError("Kamera dar nepasiruošusi. Palaukite akimirką ir bandykite dar kartą.");
      return;
    }
    setCaptureError(null);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // The preview is mirrored for a natural selfie view (scale-x-[-1]); mirror the capture to match what was seen.
    const ctx = canvas.getContext("2d");
    ctx?.translate(canvas.width, 0);
    ctx?.scale(-1, 1);
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCaptureError("Nepavyko padaryti nuotraukos. Bandykite dar kartą.");
          return;
        }
        setPhotoBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("captured");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      },
      "image/jpeg",
      0.92,
    );
  }

  function retake() {
    setPhotoBlob(null);
    setPreviewUrl(null);
    setCaptureError(null);
    setCanCapture(false);
    setPhase("starting");
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPhase("live");
      })
      .catch(() => setPhase("unavailable"));
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptureError(null);
    setPhotoBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("captured");
  }

  return (
    <div className="space-y-5">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {phase === "unavailable" ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <WarningCircleIcon size={28} />
            <p>Nepavyko pasiekti kameros. Įkelkite nuotrauką iš galerijos.</p>
          </div>
        ) : phase === "captured" && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a Next-optimizable remote image
          <img src={previewUrl} alt="Jūsų nuotrauka" className="size-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setCanCapture(true)}
            className="size-full scale-x-[-1] object-cover"
          />
        )}
      </div>

      {captureError ? <p className="text-sm text-destructive">{captureError}</p> : null}

      {phase === "captured" ? (
        <Button type="button" variant="outline" className="min-h-11 w-full" onClick={retake}>
          <ArrowClockwiseIcon size={18} /> Fotografuoti iš naujo
        </Button>
      ) : (
        <div className="space-y-2">
          <Button type="button" className="min-h-11 w-full" disabled={phase !== "live" || !canCapture} onClick={capture}>
            <CameraIcon size={18} /> Padaryti nuotrauką
          </Button>
          <label className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-border text-sm font-bold hover:bg-muted">
            Įkelti nuotrauką
            <input type="file" accept="image/*" capture="user" className="sr-only" onChange={onFilePicked} />
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={onBack}>
          Atgal
        </Button>
        <Button type="button" className="min-h-11 flex-1" disabled={!photoBlob} onClick={() => photoBlob && onNext(photoBlob)}>
          Toliau
        </Button>
      </div>
    </div>
  );
}
