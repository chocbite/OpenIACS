import { sleep, type Prettify } from '@chocbite/ts-lib-common';
import form, { FormElement, FormValue, type FormGroup } from '@chocbite/ts-lib-form';
import { type Option } from '@chocbite/ts-lib-result';
import { main_panel_container } from '@libComposition';
import { Prompt } from './shared';

type GroupExtractVals<Arr extends any[]> = Arr extends [infer Head, ...infer Tail]
	? Head extends FormValue<infer T, infer ID>
		? [FormValue<T, ID>, ...GroupExtractVals<Tail>]
		: [...GroupExtractVals<Tail>]
	: [];
type GroupToKeyVal<Arr extends FormValue<any, any>[]> = {
	[K in Arr[number] as K['form_id']]: K extends FormValue<infer T, any> ? T : never;
};

interface Submit<RT extends object> {
	text: string;
	click?: (group: FormGroup<RT, any>) => void;
}

export function prompt_form<
	L extends FormElement[],
	T extends object = Prettify<Partial<GroupToKeyVal<GroupExtractVals<L>>>>,
>(text: string, elements: [...L], submit: Submit<T>): Promise<Option<Partial<T>>> {
	return new Promise<Option<Partial<T>>>((resolve) => {
		const group = form.group<L, undefined, T>({
			elements,
			embed: true,
			column: '6rem',
		});
		const prompt = new Prompt(
			text,
			form.group({
				elements: [
					group,
					form.button({
						text: submit.text,
						on_click: () => {
							const values = group.value_partial;
							submit.click?.(group);
							prompt.content_close();
							resolve(values.to_option());
						},
						center: true,
					}),
				],
			}),
			async (e) => {
				if (e.key === 'Enter') {
					await sleep(0);
					const values = group.value_partial;
					submit.click?.(group);
					prompt.content_close();
					resolve(values.to_option());
				}
			},
			() => elements[0].focus(),
		);
		main_panel_container
			.create_panel(prompt, {
				sizeable: false,
				moveable: false,
				modal: true,
				width: 20,
			})
			.on_close()
			.then(resolve);
	});
}
