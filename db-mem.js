import { randomUUID } from 'crypto';

export class Database {
    #videos = new Map();

    list(search) {
        return Array.from(this.#videos.entries())
            .map(([id, data]) => ({
                id,
                ...data
            }))
            .filter(video => !search || video.title.includes(search));
    }

    create(video) {
        const videoId = randomUUID();
        this.#videos.set(videoId, video);
        return videoId;
    }

    update(id, video) {
        if (this.#videos.has(id)) {
            this.#videos.set(id, video);
            return true;
        }
        return false;
    }

    delete(id) {
        this.#videos.delete(id);
    }
}