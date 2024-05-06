import * as logger from "firebase-functions/logger";
import fetch from "node-fetch";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
dotenv.config();

const bucket = admin.storage().bucket("ai-marketing-e2b7e.appspot.com");

/**
 * Retrieves the Soundraw API key from environment variables.
 * @throws {Error} Throws an error if the Soundraw API key is not set in the environment variables.
 */
const SOUNDRAW_API_KEY: string = process.env.SOUNDRAW_API_KEY ?? (() => {
    throw new Error("Required environment variable SOUNDRAW_API_KEY is not set");
})();

/**
 * Defines the input parameters for the Soundraw music composition.
 */
export type SoundrawInput = {
    genres: string;
    moods: string;
    themes: string;
    length: number;
};

/**
 * Represents the expected structure of the Soundraw music composition output.
 */
export type SoundrawOutput = {
    id: string;
    url: string; // The URL to the generated music file.
};

/**
 * Describes the structure of the response from the Soundraw API.
 */
export type SoundrawResponse = {
    status: "success" | "error"; // Status of the composition request.
    message: string; // Descriptive message regarding the status.
    data: SoundrawOutput | null; // The output generated by the API, nullable.
};

/**
 * Composes music using the Soundraw API with specified input parameters and returns the response.
 * @param {SoundrawInput} input The input parameters for the music composition.
 * @return {Promise<SoundrawResponse>} A promise that resolves with the response from the Soundraw API.
 * @throws {Error} Throws an error if the call to the Soundraw API fails.
 */
export async function composeMusic(input: SoundrawInput): Promise<string> {
    const apiUrl = "https://soundraw.io/api/v2/musics/compose";
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SOUNDRAW_API_KEY}`,
    };
    const body = JSON.stringify(input);

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: body,
        }).then((res) => res.json());

        if (!response.ok) {
            throw new Error(`API response not ok: ${response.status} ${response.statusText}`);
        }

        const musicFileUrl = response.m4a_url;

        const musicResponse = await fetch(musicFileUrl);
        if (!musicResponse.ok) {
            throw new Error(`Failed to download the music file: ${musicResponse.status} ${musicResponse.statusText}`);
        }

        const fileName = `soundraw/${uuidv4()}.m4a`;
        const file = bucket.file(fileName);

        const musicBuffer = Buffer.from(await musicResponse.arrayBuffer());

        await file.save(musicBuffer, {
            metadata: {
                contentType: "audio/mpeg",
            },
        });

        const [musicUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 2 * 60 * 60 * 1000,
        });

        return musicUrl;
    } catch (error) {
        logger.error("Failed to generate music: ", error);
        throw new Error("Soundraw music generation failed " + (error as Error).message);
    }
}