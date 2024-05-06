import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { v4 as uuidv4 } from "uuid";
import { firebaseAdmin } from "../firebase/firebaseInit";
import { FieldValue } from "firebase-admin/firestore";

export type GenerationJob = {
    createdAt: FieldValue;
    userId: string;
    id: string;
    type: "podcastAd";
    status: "running" | "completed" | "failed" | "canceled";
    components: PodcastAdComponents;
    input: {
        music: MusicInput;
        vo: VoInput;
    }
    output: string;
}

export type PodcastAdComponents = {
    musicUrl: string;
    voUrl: string;
}

type MusicInput = {
    prompt: MusicPrompt;
    durationInSeconds: number;
    volume: number;
    offsetInMilliseconds: number;
}

type MusicPrompt = {
    genres: string;
    moods: string;
    themes: string;
    length: number;
}

type VoInput = {
    prompt: VoPrompt;
    durationInSeconds: number;
    volume: number;
    offsetInMilliseconds: number;
}

type VoPrompt = {
    voice: string;
    input: string;
}

export const generatePodcastAd = onRequest(async (request, response) => {
    let job: GenerationJob;

    try {
        job = {
            createdAt: FieldValue.serverTimestamp(),
            userId: request.body.userId,
            id: uuidv4(),
            status: "running",
            type: "podcastAd",
            components: {
                musicUrl: "",
                voUrl: "",
            },
            input: {
                music: {
                    prompt: {
                        genres: "",
                        moods: "",
                        themes: "",
                        length: 0,
                    },
                    durationInSeconds: 1,
                    volume: 1,
                    offsetInMilliseconds: 0,
                },
                vo: {
                    prompt: {
                        voice: "",
                        input: "",
                    },
                    durationInSeconds: 1,
                    volume: 1,
                    offsetInMilliseconds: 0,
                },
            },
            output: "",
        };
    } catch (error) {
        logger.error("Error generating podcast ad", error, { structuredData: true });
        response.status(500).send("Error: " + error);
        return;
    }

    try {
        const jobRef = firebaseAdmin.firestore().collection("users").doc(job.userId).collection("generationJobs").doc(job.id);

        jobRef.set(job);

        logger.info("Started new podcast ad generation job: " + job.id);
        response.status(200).json({ message: "Started new podcast ad generation job", jobId: job.id });
    } catch (error) {
        logger.error("Error starting new podcast ad generation job", error, { structuredData: true });
        response.status(500).send("Error: " + error);
        return;
    }
});
