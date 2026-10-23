import { FunctionComponent } from "preact";
import { IconName } from "../../../shared/src/icon-name";
import { Card } from "../../../shared/src/components/card";
import { Flex } from "../../../shared/src/components/flex";

interface ToolCardProps {
  link: string;
  icon: IconName;
  title: string;
  description?: string;
}

export const ToolCard: FunctionComponent<ToolCardProps> = ({
  link,
  icon,
  title,
  description,
}) => (
  <Card class="toolkit__tool" link={link}>
    <Flex align="center">
      {icon && (
        <span class="material-icons" aria-hidden="true">
          {icon}
        </span>
      )}
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </Flex>
  </Card>
);
