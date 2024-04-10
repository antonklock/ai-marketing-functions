import * as logger from "firebase-functions/logger";
import { Leap } from "@leap-ai/workflows";

import "dotenv/config";

/**
 * Retrieves the LEAP API key from environment variables.
 * @throws {Error} Throws an error if the LEAP API key is not set in the environment variables.
 */
const LEAP_API_KEY: string = process.env.LEAP_API_KEY ?? (() => {
    throw new Error("Required environment variable LEAP_API_KEY is not set");
})();

/**
 * Defines the input parameters for the Leap workflow.
 */
export type LeapInput = {
    music_prompt: string; // The music description or prompt.
    duration_in_seconds: number; // The duration for the music generation, in seconds.
};

/**
 * Represents the expected structure of the Leap workflow output.
 */
export type LeapOutput = {
    generated_music: string; // The URL to the generated music file.
};

/**
 * Describes the structure of the response from a Leap workflow.
 */
export type LeapResponse = {
    id: string; // Unique identifier for the workflow run.
    version_id: string; // Version identifier of the workflow.
    status: "completed" | "running" | "failed"; // Current status of the workflow.
    created_at: string; // Timestamp when the workflow was initiated.
    started_at: string | null; // Timestamp when the workflow started execution, nullable.
    ended_at: string | null; // Timestamp when the workflow execution ended, nullable.
    workflow_id: string; // Identifier of the workflow.
    error: string | null; // Any error message from the workflow execution, nullable.
    input: LeapInput | null; // The input provided to the workflow, nullable.
    output: LeapOutput | null; // The output generated by the workflow, nullable.
};

/**
 * Triggers a Leap workflow with the specified input parameters and returns the response.
 * @param {LeapInput} input The input parameters for the Leap workflow.
 * @return {Promise<LeapResponse>} A promise that resolves with the response from the Leap workflow.
 * @throws {Error} Throws an error if the call to the Leap API fails.
 */
export async function triggerLeapWorkflow(input: LeapInput): Promise<LeapResponse> {
    const leap = new Leap({
        apiKey: LEAP_API_KEY,
    });

    try {
        logger.info("Received input: ", input, { structuredData: true });

        const leapResponse = await leap.workflowRuns.workflow({
            workflow_id: "wkf_FZIrfeC0AGcbTf",
            webhook_url: "https://leapHook-dx3v2rbg6q-uc.a.run.app",
            input: input,
        });

        return leapResponse.data as LeapResponse;
    } catch (error) {
        logger.error("Error calling Leap API: ", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}
