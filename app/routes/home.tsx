import type { Route } from "./+types/home";
import { useFetcher } from "react-router";
import { useEffect, useRef } from "react";
import type { SearchResult } from "../server/ai-search";

type ActionData = {
	results?: SearchResult[];
	error?: string;
};

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export async function action({ request, context }: Route.ActionArgs) {
	const form = await request.formData();
	const query = String(form.get("query") ?? "").trim();
	if (!query) {
		return { results: [], error: "Please enter a search query." } satisfies ActionData;
	}

	const { runAISearch } = await import("../server/ai-search");
	const results = await runAISearch(query, context.cloudflare.env);
	return { results } satisfies ActionData;
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const fetcher = useFetcher<ActionData>();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;
		fetcher.submit(new FormData(form), { method: "post" });
	};

	const results = fetcher.data?.results ?? [];
	const error = fetcher.data?.error;

	return (
		<main className="min-h-[80vh] flex flex-col items-center justify-start pt-16 px-4">
			<div className="w-full max-w-3xl text-center space-y-4">
				<h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
					AI Search
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-300">
					{loaderData.message}
				</p>

				<fetcher.Form method="post" onSubmit={onSubmit} className="mt-4">
					<div className="flex gap-2 items-center">
						<input
							ref={inputRef}
							name="query"
							type="text"
							placeholder="Ask anything…"
							className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<button
							type="submit"
							className="inline-flex items-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 font-medium shadow-sm"
						>
							Search
						</button>
					</div>
				</fetcher.Form>

				{error && (
					<p className="text-red-600 dark:text-red-400 mt-3">{error}</p>
				)}
			</div>

			<section className="w-full max-w-5xl mt-10">
				{fetcher.state !== "idle" ? (
					<div className="text-sm text-gray-600 dark:text-gray-300">Generating results…</div>
				) : results.length > 0 ? (
					<ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{results.map((r, idx) => (
							<li
								key={`${r.url}-${idx}`}
								className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-5 shadow-sm hover:shadow-md transition-shadow"
							>
								<a href={r.url} target="_blank" rel="noreferrer" className="group">
									<h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 group-hover:underline">
										{r.title}
									</h3>
									<p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
										{r.snippet}
									</p>
									<p className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
										{r.url}
									</p>
								</a>
							</li>
						))}
					</ul>
				) : (
					<div className="text-sm text-gray-600 dark:text-gray-300">
						Enter a query to get 10 AI-generated results.
					</div>
				)}
			</section>
		</main>
	);
}
